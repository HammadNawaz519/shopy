/**
 * Local shell constants.
 *
 * The local shell is the instant-startup layer of the SHOPY Capacitor app:
 * it renders the real landing page UI from APK-bundled assets, then keeps the
 * real application (remote origin below) as the source of truth for all
 * routes, authentication, cart, checkout and deep links.
 *
 * Keep in sync with `server.url` in capacitor.config.ts history and the
 * production deployment target.
 */
export const REMOTE_ORIGIN = "https://buyatshopy.vercel.app";

/** Relative paths that the shell serves from its own bundled assets. */
export function isRemoteUrl(href: string): boolean {
  return /^https?:\/\//.test(href) || href.startsWith("//");
}

/** Map an app-relative path ("/products") to the live application. */
export function remotePath(path: string): string {
  const p = path || "/";
  if (isRemoteUrl(p) || p.startsWith("data:")) return p;
  return `${REMOTE_ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
}
