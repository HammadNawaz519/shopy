/**
 * Background live-data layer for the instant-launch shell.
 *
 * Two jobs, both strictly non-blocking and both safe to fail:
 *
 *  1. `installApiFetchPatch` — the shell's own origin has no API routes, so
 *     every relative `/api/*` fetch made by the reused app components
 *     (SearchModal, useNavigationLinks fallback, Newsletter) is retargeted
 *     at the live application, which answers with CORS headers. Components
 *     keep their original code paths; only the destination changes.
 *
 *  2. `warmRemoteApp` — pre-loads the live app's document and its static
 *     chunks into the WebView's disk cache so the first handoff navigation
 *     (any link tap) resolves instantly instead of cold-starting the
 *     remote site.
 *
 * Nothing here may run before the first landing frame: callers invoke it
 * from an idle callback after paint.
 */
import { REMOTE_ORIGIN } from "./constants";

const originalFetch = typeof fetch === "function" ? fetch.bind(globalThis) : null;

export function isShellApiPath(input: Request | URL | string): boolean {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url.startsWith("//")) return true;
  if (url.startsWith("/")) return url.startsWith("/api/");
  if (url.startsWith("https://localhost")) return false; // same-origin shell asset
  return false;
}

/** Retarget relative /api/* calls at the live app so reused components work. */
export function installApiFetchPatch(): void {
  if (!originalFetch) return;
  if ((window as any).__shopyApiFetchPatched) return;
  (window as any).__shopyApiFetchPatched = true;

  window.fetch = ((input: Request | URL | string, init?: RequestInit) => {
    if (isShellApiPath(input)) {
      const path =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname + input.search
            : input.url;
      return originalFetch(`${REMOTE_ORIGIN}${path}`, {
        ...init,
        mode: "cors",
        credentials: "omit",
      });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
}

async function safeFetchJson(url: string, init?: RequestInit) {
  const res = await originalFetch(url, { ...init, mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

/**
 * Pull the landing page's live data from the production APIs. Each slice
 * degrades to the bundled snapshot (or the component's own defaults) when
 * the network is unavailable — the first visible frame never waits here.
 */
export interface LiveLandingData {
  homepage: any | null;
  categories: any[];
  featuredProducts: any[];
  navigation: any[];
  editorialQuote: any;
}

export async function refreshLandingData(): Promise<LiveLandingData | null> {
  const [homepage, categories, products, navigation, quote] = await Promise.allSettled([
    safeFetchJson(`${REMOTE_ORIGIN}/api/homepage`),
    safeFetchJson(`${REMOTE_ORIGIN}/api/categories`),
    safeFetchJson(`${REMOTE_ORIGIN}/api/products?featured=true`),
    safeFetchJson(`${REMOTE_ORIGIN}/api/navigation`, { cache: "no-store" }),
    safeFetchJson(`${REMOTE_ORIGIN}/api/editorial/quote`).catch(() => undefined),
  ]);

  const data: LiveLandingData = {
    homepage: homepage.status === "fulfilled" ? homepage.value?.config ?? null : null,
    categories: categories.status === "fulfilled" ? (categories.value?.categories ?? []) : [],
    featuredProducts: products.status === "fulfilled" ? (products.value?.products ?? []) : [],
    navigation: navigation.status === "fulfilled" ? (navigation.value?.navigation ?? []) : [],
    editorialQuote: quote.status === "fulfilled" ? quote.value?.data : undefined,
  };

  // Keep only the slices that actually returned data; missing slices stay on
  // the bundled snapshot so a partial outage never empties the page.
  return data;
}

/**
 * The local Next.js build produces the same content-hashed static assets as
 * the production deployment (immutable `/_next/static/...` URLs), so the
 * build script inlines this list. `no-cors` fetches are opaque — the
 * response body is unreadable — but they are still stored in the WebView's
 * HTTP disk cache, which is all the warm-up needs.
 */
let remoteStaticAssets: string[] = [];
try {
  remoteStaticAssets = JSON.parse(__SHOPY_SHELL_REMOTE_STATIC__) ?? [];
} catch {
  remoteStaticAssets = [];
}

/**
 * Warm the WebView's HTTP cache with the live app's immutable static chunks.
 * Runs once, on idle, when online. Failures are ignored — handoff still
 * works, it just pays the normal network cost.
 */
let warmed = false;
export function warmRemoteApp(): void {
  if (warmed || !originalFetch) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  warmed = true;

  const run = async () => {
    try {
      await Promise.allSettled(
        remoteStaticAssets.map((ref) =>
          originalFetch(`${REMOTE_ORIGIN}${ref}`, {
            mode: "no-cors",
            credentials: "omit",
          })
        )
      );
    } catch {
      /* background warm-up only */
    }
  };

  const idle = (window as any).requestIdleCallback;
  if (typeof idle === "function") {
    idle(() => void run(), { timeout: 8000 });
  } else {
    setTimeout(() => void run(), 1500);
  }
}
