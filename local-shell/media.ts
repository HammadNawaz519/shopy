/**
 * Image-source resolver for the instant-launch shell.
 *
 * The shell is served from the local `https://localhost` origin. The landing
 * data (bundled snapshot and the idle live refresh) reference media by the
 * live application's relative paths — `/api/media/…` — which resolve to
 * `https://localhost/api/media/…` and 404, so the images render empty. The
 * `installApiFetchPatch` in `live.ts` only retargets `fetch()` calls, never
 * the `<img src>` the reused components render, so this helper owns the image
 * case.
 *
 * It decides where each image actually lives, and is deliberately a cheap,
 * synchronous string check so it adds nothing to the first frame:
 *
 *  - already-absolute (http/https/data/blob, or protocol-relative `//host`)
 *      → unchanged
 *  - local bundled media (`/media/…`) — files the build script downloaded into
 *    the APK so the first screen renders offline → unchanged
 *  - other bundled shell-root assets (`/hero-beige.jpg`, `/category-tops.jpg`, …)
 *      → unchanged (served from the APK)
 *  - relative live-app media (`/api/media/…`, `/api/images/…`)
 *      → the live origin, so the image loads over the network AFTER the first
 *        frame whenever it was not bundled (a live refresh, a new product, or
 *        a build that ran offline)
 */
import { REMOTE_ORIGIN } from "./constants";

export function resolveMediaUrl(src: string): string {
  if (!src) return src;
  // Already an absolute / protocol-relative / data / blob URL — use as-is.
  if (/^(https?:|data:|blob:)/i.test(src) || src.startsWith("//")) return src;
  // Bundled local media (APK asset) — already correct.
  if (src.startsWith("/media/") || src.startsWith("/images/")) return src;
  // Live-app media the shell does not bundle — point it at the live origin so
  // it loads over the network after the first frame.
  if (src.startsWith("/api/media/") || src.startsWith("/api/images/")) {
    return `${REMOTE_ORIGIN}${src}`;
  }
  // Any other relative asset (bundled public files, SVG, …) — as-is.
  return src;
}
