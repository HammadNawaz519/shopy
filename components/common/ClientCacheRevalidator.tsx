"use client";

import { useEffect } from "react";

export default function ClientCacheRevalidator() {
  useEffect(() => {
    // 1. Unregister obsolete or rogue third-party service workers on mobile Chrome/Safari
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
  }, []);

  return null;
}
