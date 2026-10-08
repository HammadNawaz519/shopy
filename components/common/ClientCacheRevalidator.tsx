"use client";

import { useEffect } from "react";

// Service worker scripts owned by SHOPY that must be kept for offline caching.
const SHOPY_SW_SCRIPTS = ["/sw-enhanced.js", "/sw.js"];

/**
 * Unregisters rogue or third-party service workers that could otherwise
 * intercept SHOPY's traffic. SHOPY's own PWA worker(s) are detected by their
 * script URL and left in place so the offline app shell keeps working.
 */
export default function ClientCacheRevalidator() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          const worker =
            registration.active || registration.installing || registration.waiting;
          if (!worker) {
            continue;
          }

          let script = "";
          try {
            script = new URL(worker.scriptURL, window.location.origin).pathname;
          } catch {
            script = worker.scriptURL;
          }

          // Keep SHOPY's own workers; unregister everything foreign.
          if (SHOPY_SW_SCRIPTS.some((s) => script.endsWith(s))) {
            continue;
          }

          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
