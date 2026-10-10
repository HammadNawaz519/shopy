"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Offline Deep-Link Recovery.
 *
 * When the app is cold-started (or fully reloaded) while OFFLINE, the service
 * worker serves the cached home shell for any URL it has no document cache
 * entry for, and injects:
 *
 *   window.__shopyOfflineTarget = "/product/..."
 *
 * into that HTML. This component reads the flag on boot and re-routes the
 * client router to the intended page — which is now served from the cached
 * RSC flight payload (warmed while online), so offline deep links land on
 * the right page instead of bouncing back to home.
 *
 * The flag is consumed exactly once per document load; a normal online load
 * never has the flag and does nothing.
 */
export default function OfflineRecovery() {
  const router = useRouter();

  useEffect(() => {
    const w = window as unknown as { __shopyOfflineTarget?: string | null };
    const target = w.__shopyOfflineTarget;
    if (typeof target !== "string" || target.length === 0) return;

    w.__shopyOfflineTarget = null; // consume — never re-fire

    // The flag is only ever set when the loaded document is a STAND-IN for
    // another url (the cached shell served for an uncached/offline request).
    // The browser's location already says `target` while the document content
    // is for a different route, so force the router to reconcile: replace to
    // the target, which resolves from the warmed RSC flight cache when offline.
    router.replace(target, { scroll: false });
  }, [router]);

  return null;
}
