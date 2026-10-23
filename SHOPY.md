# SHOPY Atelier

Full e-commerce web + Android app. Next.js 14 (App Router) on Vercel, Supabase PostgreSQL + Upstash Redis, wrapped in a Capacitor Android shell that loads the **live site** in a WebView (`server.url`) — no APK rebuild needed for web changes.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind, TypeScript |
| Backend | Next.js API routes (force-dynamic), Supabase Postgres (`pg`), Upstash Redis |
| Auth | Google OAuth (web + in-app Credential Manager), HTTP-only session cookie (`shopy_session_id`), JWT sessions, bcrypt passwords |
| App shell | Capacitor 8 Android (APK), PWA service worker for offline |
| Payments | COD + bank transfer/Raast verification, email (nodemailer/Resend) |

## Key admin features

- **Orders (messages-style list)** — new orders since your last visit appear as dark "NEW" cards on top; seen orders sit under date headers ("Today", "Yesterday") with arrival time + **Checked** label. Opening the section marks them seen (chat-list behavior).
- **Print preview with paper size selector** — A4 / A5 / A6 / Small (10×12") / Medium (12×16") / Large (14×19") / XL (18×21"). Live preview rescales the slip instantly; browser print honors the selected sheet via injected `@page` CSS. A4 is the default and prints exactly like the original design.
- **DB reset protected by fresh Google re-auth** — wiping the database now requires a full Google re-authentication (`max_age=0`, `prompt=select_account`). The verified callback mints a **10-minute, single-use, session-bound token**; the reset endpoint consumes it server-side before touching data. Expired, replayed, or mismatched authorizations are rejected. No frontend flag ever authorizes a destructive operation.

## Security model (short)

- Admin APIs: `getAdminUser()` — signed JWT session + admin role, server-side only.
- All auth routes: per-IP rate limits (Redis sliding window, memory fallback), open-redirect defense, edge middleware guarding `/admin/*` and `/account/*`.
- Passwords: bcrypt (12 rounds). Sessions: stateless signed JWT, 7-day TTL.
- Destructive ops: server-minted single-use Google re-auth tokens (see above).

## Running / deploying

```bash
npm install
cp .env.example .env.local   # fill Supabase + Upstash + Google + SMTP vars
npm run dev                  # local
# Deploy: push to main (Vercel)
```

### Android APK (only when NATIVE code changes)

```bash
npm run cap:android          # next build + cap sync android
```

Web-only changes ship by pushing to main — the APK loads the live site.

## Env vars (required in production)

`DATABASE_URL` (Supabase) · `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` · `JWT_SECRET` / `SESSION_SECRET` · `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (Web client) · `GOOGLE_ANDROID_CLIENT_ID` · SMTP / email vars · `APP_URL`
