"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";

/**
 * GLOBAL native Google sign-in resume.
 *
 * GoogleButton only auto-resumes on the pages it is mounted on (login/register).
 * If the in-app sign-in tab completes while the app is suspended, or the user
 * returns to the app (or reopens it) landing on the HOME page, the pending
 * handoff record is never picked up and the user is stuck logged out.
 *
 * This component is mounted in the root layout (inert in a normal browser), so on
 * the native shell it completes ANY stored handoff from wherever the user lands
 * and navigates to the destination, which establishes the authenticated session.
 * It only runs when a stored record exists and we are not already on a page that
 * owns its own resume, so it never double-polls against GoogleButton.
 */
const HANDOFF_STORAGE_KEY = "shopy_google_native_handoff";
const POLL_INTERVAL_MS = 1500;
const POLL_WINDOW_MS = 9 * 60 * 1000;

function readStoredHandoff(): { handoffId: string; redirect: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as { handoffId?: string; redirect?: string | null };
    if (!rec || typeof rec.handoffId !== "string" || rec.handoffId.length < 8) return null;
    return { handoffId: rec.handoffId, redirect: rec.redirect ?? null };
  } catch {
    return null;
  }
}

export default function NativeGoogleAuthResume() {
  const pathname = usePathname();
  const pollInFlight = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;
    // GoogleButton owns the resume on its own pages.
    if (pathname === "/login" || pathname === "/register") return;

    const navigate = (to: string) => {
      window.location.href = to;
    };

    const finish = async (handoffId: string, redirect: string | null) => {
      if (pollInFlight.current) return;
      pollInFlight.current = true;
      const deadline = Date.now() + POLL_WINDOW_MS;

      const step = async () => {
        if (Date.now() > deadline) {
          // Keep the record; the next refocus or a GoogleButton mount resumes it.
          pollInFlight.current = false;
          return;
        }
        try {
          const res = await fetch(
            `/api/auth/google/handoff?handoffId=${encodeURIComponent(handoffId)}`,
            { credentials: "same-origin", cache: "no-store" }
          );
          console.log(`NATIVE GOOGLE POLL handoffId=${handoffId} status=${res.status}`);
          if (res.status === 200) {
            let data: { status?: string; destinationPath?: string };
            try {
              data = await res.json();
            } catch {
              data = {};
            }
            if (data?.status === "complete") {
              window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
              navigate(data.destinationPath || "/account");
              return;
            }
          } else if (res.status === 409 || res.status === 400) {
            const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
            const me = (await meRes.json()) as { user?: { role?: string } | null };
            if (me?.user) {
              window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
              navigate(me.user.role === "admin" ? "/admin" : redirect || "/account");
              return;
            } else if (res.status >= 500) {
              pollInFlight.current = false;
              return;
            }
            window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
            pollInFlight.current = false;
            return;
          }
          // 202 pending (or any other status): keep polling.
          window.setTimeout(step, POLL_INTERVAL_MS);
        } catch {
          // Network blip — keep polling until the deadline.
          window.setTimeout(step, POLL_INTERVAL_MS);
        }
      };

      step();
    };

    const start = () => {
      const rec = readStoredHandoff();
      if (!rec) return;
      finish(rec.handoffId, rec.redirect);
    };

    start();
    const onWake = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      start();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [pathname]);

  return null;
}
