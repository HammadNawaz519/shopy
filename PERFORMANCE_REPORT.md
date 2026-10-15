# SHOPY — Instant Launch & Native-App Performance Report

Date: 2026-10-15
Scope: Capacitor 8 Android shell + Next.js 14 App Router storefront + Redis/Postgres caching layer.
Baseline policy: production build only (`next build` + `next start`), never the dev server.

## 1. Architecture verified before any change

- Native shell: Capacitor `com.shopy.fashion`, loads the **deployed site**
  (`https://buyatshopy.vercel.app`) in the WebView (`capacitor.config.ts` → `server.url`);
  `webDir: .next` is only a fallback asset source. The PWA service worker
  (`public/sw-enhanced.js`) provides the offline app shell + SWR catalog cache.
- Backend: Supabase PostgreSQL (via `pg` pool, `lib/db/client.ts`) + Upstash Redis
  (`lib/redis.ts`, versioned `shopy:v4:*` keys, stampede-protected, zero-throw fail-safe).
- Startup request path (before): HTML shell → 2× `GET /api/navigation` (no-store,
  one each from Navbar + Footer) → `HEAD /api/auth/me` (connectivity) →
  `GET /api/auth/me` (session) → cart hydration (IndexedDB/localStorage, local only) →
  IdlePrefetcher `next/link` prefetches.
- Already in place (kept, not re-invented): PWA SW with PAGES/FLIGHT/RUNTIME caches,
  offline catalog warmer, RSC initial data on every catalog page, `next/image`
  AVIF/WebP + blur placeholders, `next/font` (swap), ISR 300s on public pages,
  Redis versioned catalog cache, IndexedDB user-scoped cart/offline state,
  runtime DDL removed from the request path (`ensureTablesExist` is a no-op).

## 2. Root causes of slow startup / navigation

1. **White-flash launch in the WebView (Android).** The launch theme shows the
   branded splash PNG as the *window background*, but the WebView is opaque
   (white). As soon as the WebView lays out (before any web content), it covers
   the splash with white → blank white screen on every cold start; the splash
   effectively "flickers" and dies far earlier than the first SHOPY frame.
2. **Navigation links fetched client-side, twice, on every launch.**
   `Navbar` and `Footer` each fire `GET /api/navigation` with `cache:"no-store"`
   on mount; the endpoint is `force-dynamic` with no store-level Redis cache.
   Links are therefore blank in the first frame and the shell's header/footer
   re-render on network latency.
3. **Session-validation waterfall.** For a logged-in user, launch did
   `HEAD /api/auth/me` (3s-timeout connectivity probe) **then** `GET /api/auth/me`
   — two sequential round-trips; the GET also had **no timeout**, so a
   black-holed network could hang `auth.loading` indefinitely.
4. **Service-worker activation delay.** `activate` awaited the 4-endpoint
   background warm-up (`warmUpCriticalData`) in its `waitUntil` chain, so the
   new worker only took control (clients.claim) after the slowest warm-up
   fetch — slowing first interception on version updates.
5. (Latent, fixed in passing) `Footer` called hooks **after** a conditional
   `return null` — hook-count instability on client-side navigation to
   footer-less routes.

## 3. Files changed and why

| File | Change |
|---|---|
| `android/app/src/main/java/com/shopy/fashion/MainActivity.java` | WebView background set **transparent** (immediately after `onCreate`, re-applied on next frame + 150 ms retry) so the splash window-background stays visible *behind* the WebView until the web content's first paint. Splash now dismisses exactly when the first meaningful SHOPY interface is ready — no white flash, no duplicate splash, warm starts (background → foreground) unchanged (no re-creation), recreation plays the same sequence. |
| `app/layout.tsx` | Root layout now awaits `getCachedNavigationItems(true)` (Redis-cached, fail-safe `[]`) and passes `initialNavItems` to `Navbar`/`Footer` — navigation links in the first HTML frame; zero `/api/navigation` requests on a normal launch. |
| `lib/db/store.ts` | `getNavigationItems` Redis-cached (`shopy:v4:navigation:active\|all`, 30 min, stampede-protected); error fallback is **never** cached; admin add/update/delete/reorder invalidate `shopy:v4:navigation:*` instantly. |
| `lib/redis.ts` | `CACHE_TTL.NAVIGATION = 1800` added. |
| `lib/client/navigation.ts` *(new)* | `useNavigationLinks(initial)` shared hook: server-rendered items first; if SSR had nothing, **one** deduped in-flight client fetch serves both Navbar and Footer. No new state/caching library — plain module + in-flight promise. |
| `components/layout/Navbar.tsx` | Accepts `initialNavItems`; uses the shared hook; the old mount-time `no-store` fetch is gone. Dedup/exclusion rules unchanged. |
| `components/layout/Footer.tsx` | Same as Navbar; hook moved **before** the conditional return (Rules-of-Hooks fix); default shop links kept as fallback. |
| `context/EnhancedAuthContext.tsx` | `refreshUser` session validation collapsed from HEAD+GET to **one** `GET /api/auth/me` with a 10 s abort bound; offline/error path still falls back to cached user data; periodic 30 s connectivity tracker untouched. |
| `public/sw-enhanced.js` | `activate` no longer awaits the warm-up (fire-and-forget after `clients.claim()`), so worker takeover isn't delayed by slow warm-up fetches. All caching strategies (SWR pages/flight/APIs, never-cache auth/cart/orders/admin) unchanged. |

Explicitly **not** changed: app id, signing keystores, OAuth plugin/routing,
deep-link/custom URL scheme, `server.url`, ISR/revalidate settings, image
pipeline, CSP/security headers, admin polling intervals, order/checkout flow.

## 4. Tests & build results

- `npm run build` — passed for the after revision.
- `npx tsc --noEmit` — passed.
- `:app:compileDebugJavaWithJavac` — passed with JDK 21. The only compiler output is the existing deprecated-API warning from `MainActivity.java`.
- `npm run lint` — not runnable non-interactively because this checkout has no ESLint configuration; Next.js opened its first-run Strict/Base configuration prompt. No lint configuration was created as part of this change.

## 5. Before/after measurements

Measured with `scripts/measure-startup.mjs` against separate local `next start`
processes. These numbers include local database/Redis availability and are not
representative of a real Android device or production network:

| Probe | Baseline | After |
|---|---:|---:|
| Home cold TTFB | 4857 ms | 4822 ms |
| Home warm average TTFB | 2048 ms | 2124 ms |
| Home document size | 49.7 KB | 49.5 KB |

The local probe confirms successful responses and comparable server-rendered
output, but it cannot measure the Android WebView splash handoff, service-worker
activation, or the eliminated duplicate client navigation fetches. No overall
timing improvement is claimed from this synthetic run.

## 6. Remaining bottlenecks

- Cold first launch of the Android app still pays one full network fetch of the
  site (remote `server.url`); the service worker only takes over **after** that
  first load, so the *second* launch is the fast one. (Mitigations: pre-cached
  assets or `server.androidHostname` are out of scope — the remote backend is a
  requirement of this architecture; all APIs/ISR run on the deployed server.)
- Product images from PostgreSQL (`/api/media/[id]`) ride the 1-year immutable
  cache, but each is a serverless bytea read on first use; moving media to a
  CDN storage bucket (Supabase Storage / R2) is the remaining image-pipeline win.
- Android launch metrics on real hardware (cold/warm `am start -W` timings)
  need a device/emulator; commands below.

## 7. Rebuilding the Android APK (existing workflow)

```bash
# 1. Web build + native sync (uses the repo's own script)
cd "D:\VS Code\Shopy\Frontend"
npm run cap:android        # = next build && cap sync android

# 2. Build the APK with the repo's Gradle wrapper (SDK: D:/Claude/Tools/android-sdk)
cd android
gradlew.bat assembleDebug          # debug install for testing
gradlew.bat assembleRelease        # release (unsigned; sign in Android Studio with
                                   # android/shopy-release.keystore, or add signingConfigs)

# 3. Install / launch on a device
adb install -r app\build\outputs\apk\debug\app-debug.apk
adb shell am start -W -n com.shopy.fashion/.MainActivity
```

Or open the project in Android Studio via `npm run cap:open:android` and build
the signed release there (keystores `shopy-release.keystore` /
`shopy-oauth-release.keystore` are present in `android/`).

## 8. Measuring on-device launch (device attached)

```bash
# Cold launch (fresh process): time-to-window focus + total
adb shell am start -W -n com.shopy.fashion/.MainActivity
# Warm launch (app already running in background)
adb shell am start -W -n com.shopy.fashion/.MainActivity
# Web-side first-meaningful-paint proxy inside the app: devtools/WebView tracing,
# or `adb shell dumpsys activity startuptime`
```
