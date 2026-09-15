"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * ClientCacheRevalidator
 *
 * Ensures customers and mobile users (Chrome/Safari) ALWAYS see fresh uploaded images
 * and updated catalog content without requiring manual hard refreshes (Ctrl+F5).
 *
 * Key Operations:
 * 1. BFCache / Tab Sleep Detection:
 *    When mobile Chrome suspends a background tab and later restores it,
 *    `pageshow` (event.persisted) fires. We trigger a clean reload so stale in-memory
 *    pictures and DOM trees are replaced with fresh live data.
 *
 * 2. Visibility Change Revalidation:
 *    When a customer unlocks their phone or switches back to the Chrome tab after > 4 seconds,
 *    Next.js Server Components are silently revalidated via `router.refresh()`.
 *
 * 3. Ghost Service Worker & CacheStorage Eviction:
 *    Unregisters any legacy or third-party service workers and wipes CacheStorage on the origin
 *    so no browser-level proxy intercepts media requests.
 *
 * 4. Zero UI Impact:
 *    Completely invisible, renders `null`, preserves 100% of the UI design.
 */
export default function ClientCacheRevalidator() {
  const router = useRouter();
  const lastHiddenTimeRef = useRef<number>(0);

  useEffect(() => {
    // 1. Unregister obsolete or rogue service workers on mobile Chrome/Safari
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().catch(() => {});
          }
        })
        .catch(() => {});
    }

    // 2. Wipe client-side CacheStorage for origin
    if (typeof window !== "undefined" && "caches" in window) {
      caches
        .keys()
        .then((names) => {
          for (const name of names) {
            caches.delete(name).catch(() => {});
          }
        })
        .catch(() => {});
    }

    // 3. Handle BFCache (Back-Forward Cache / Mobile Chrome Tab Sleep restore)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from frozen memory/BFCache after phone sleep
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    // 4. Handle tab wakeup when user switches back to Chrome after screen lock/tab sleep
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenTimeRef.current = Date.now();
      } else if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastHiddenTimeRef.current;
        // If the page was asleep or backgrounded for more than 4 seconds:
        if (lastHiddenTimeRef.current > 0 && elapsed > 4000) {
          router.refresh();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
