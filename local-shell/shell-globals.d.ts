/**
 * Build-time definitions injected by `scripts/build-cap-shell.mjs`
 * (esbuild `define`). They replace the identifiers with JSON literals at
 * bundle time, so no runtime globals exist — the declares exist for tsc.
 */

/** JSON-encoded snapshot of the live landing data (homepage config,
 *  categories, featured products, navigation, editorial quote). */
declare const __SHOPY_SHELL_SNAPSHOT__: string;

/** JSON-encoded array (as a JSON string) of the immutable
 *  `/_next/static/...` asset paths from the local build, used to pre-warm
 *  the live app's HTTP cache ahead of handoff. */
declare const __SHOPY_SHELL_REMOTE_STATIC__: string;
