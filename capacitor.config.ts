import type { CapacitorConfig } from "@capacitor/cli";

/**
 * SHOPY Atelier — Capacitor native shell config.
 *
 * The APK now boots into the instant-launch shell (cap-shell/), a local
 * copy of the real landing page built from the same components, styles and
 * assets as the production app (see scripts/build-cap-shell.mjs). First
 * paint needs no network at all.
 *
 * The live application (https://buyatshopy.vercel.app) remains the source
 * of truth: the shell's links and the /api fetch retargeting in
 * local-shell/live.ts hand off to it, where all routes, session cookies,
 * Supabase auth, cart, checkout, the service worker and deep links keep
 * working exactly as before. `server.url` is deliberately NOT set: with a
 * remote URL the shell would load the slow remote document first and the
 * local landing layer would never get the first frame.
 */
const config: CapacitorConfig = {
  // Unique app id (reverse-DNS). CHANGE to your own before publishing, e.g.
  // match your Play Store package / domain.
  appId: "com.shopy.fashion",
  appName: "SHOPY Atelier",
  // Instant-launch landing layer, built by `npm run build:cap`
  // (next build + scripts/build-cap-shell.mjs).
  webDir: "cap-shell",
  server: {
    // Local assets are served over https so the WebView treats the shell
    // like a normal secure origin (localStorage, service workers, canvas).
    androidScheme: "https",
  },
  android: {
    // Launch background to match the SHOPY design (app shell, not the web UI).
    backgroundColor: "#F4F4F2",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
