"use client";

import { useEffect, useRef } from "react";

export default function ServiceWorkerRegister() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Check if we're in a development environment
        const isLocalhost = window.location.hostname === "localhost" ||
                           window.location.hostname === "127.0.0.1";

        // Skip service worker registration in development if needed
        if (process.env.NODE_ENV === "development" && isLocalhost) {
          console.log("[PWA] Skipping service worker registration in development");

          // Unregister any existing service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          return;
        }

        // Register the enhanced service worker
        const registration = await navigator.serviceWorker.register("/sw-enhanced.js", {
          scope: "/",
          updateViaCache: "all" as ServiceWorkerUpdateViaCache,
        });

        registrationRef.current = registration;

        console.log("[PWA] Service Worker registered with scope:", registration.scope);

        // Handle updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content is available
                console.log("[PWA] New content is available; please refresh.");

                // You can show a notification to the user here
                // For now, we'll auto-update
                window.dispatchEvent(
                  new CustomEvent("shopy:service-worker-update", {
                    detail: { registration },
                  })
                );
              } else {
                // Content is cached for offline use
                console.log("[PWA] Content is cached for offline use.");
              }
            }
          };
        };

        // Check for updates on page load
        if (registration.waiting) {
          // A waiting worker means an update is ready
          console.log("[PWA] Update ready, skipping waiting");
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Periodically check for updates (every hour)
        setInterval(() => {
          registration.update().catch(err => {
            console.warn("[PWA] Failed to check for updates:", err);
          });
        }, 60 * 60 * 1000); // 1 hour

      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);

        // Fall back to basic service worker if enhanced one fails
        try {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          console.log("[PWA] Fallback to basic service worker");
        } catch (fallbackError) {
          console.warn("[PWA] Fallback service worker also failed:", fallbackError);
        }
      }
    };

    // Wait for window load or register immediately if already loaded
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
    }

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "CACHE_UPDATED") {
        console.log("[PWA] Cache updated:", event.data.details);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      if (registrationRef.current) {
        registrationRef.current.update().catch(() => {});
      }
    };
  }, []);

  return null;
}
