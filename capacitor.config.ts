import type { CapacitorConfig } from "@capacitor/cli";

/**
 * SHOPY Atelier — Capacitor native shell config.
 *
 * This does NOT modify the web app / UI. It wraps the already-built SHOPY site
 * in native Android (and optionally iOS) shells.
 *
 * Why `server.url` is set: SHOPY is a Next.js app whose API routes, middleware,
 * Supabase/Redis and ISR all run on the server (Vercel). A static `webDir`
 * bundle cannot carry that backend, so the native shell loads the live deployed
 * site. The PWA service worker we ship then provides the offline app shell and
 * cached data inside the WebView.
 */
const config: CapacitorConfig = {
  // Unique app id (reverse-DNS). CHANGE to your own before publishing, e.g.
  // match your Play Store package / domain.
  appId: "com.shopy.fashion",
  appName: "SHOPY Atelier",
  // Next.js build output. With server.url set, the shell loads the remote URL
  // at runtime and this folder is only used as a fallback asset source.
  webDir: ".next",
  server: {
    // Your live production site (the shell wraps this URL at runtime).
    url: "https://buyatshopy.vercel.app",
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
