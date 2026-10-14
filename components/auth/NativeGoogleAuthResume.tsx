"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

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

      /**
       * Poll immediately on first call (no leading delay), then every
       * POLL_INTERVAL_MS. This ensures that when the deep-link wakes the app
       * we don't burn 1.5 s before the first attempt.
       */
      const step = async (isFirstCall = false) => {
        if (Date.now() > deadline) {
          // Keep the record; the next refocus or a GoogleButton mount resumes it.
          pollInFlight.current = false;
          return;
        }
        // Add delay only on subsequent calls (not the first immediate one).
        if (!isFirstCall) {
          await new Promise<void>((r) => window.setTimeout(r, POLL_INTERVAL_MS));
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
          // 202 / other: keep polling.
          step();
        } catch {
          // Network blip — keep polling until the deadline.
          step();
        }
      };

      step(true); // first call is immediate
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

    // ─── Deep-link handler ────────────────────────────────────────────────────
    // When Android receives the OAuth return intent it brings the app to the
    // foreground and fires appUrlOpen — either the verified HTTPS App Link
    // (https://…/oauth/complete, autoVerify intent-filter + assetlinks.json)
    // or, on older builds, the shopy://oauth/complete custom scheme. We must
    // handle it here (in addition to the visibility listener) because
    // visibilitychange fires AFTER onResume, and on some OEM ROMs with
    // aggressive process killing the WebView JS context may not receive the
    // event at all before the deep-link fires.
    let deepLinkHandle: { remove: () => void } | null = null;
    App.addListener("appUrlOpen", (event) => {
      console.log("[GOOGLE-SIGNIN] appUrlOpen", event.url);
      if (
        typeof event.url === "string" &&
        (event.url.startsWith("shopy://oauth") ||
          event.url.includes("/oauth/complete"))
      ) {
        // Immediately poll — the handoff record is already in the store.
        start();
      }
    })
      .then((h) => { deepLinkHandle = h; })
      .catch((e) =>
        console.warn("[GOOGLE-SIGNIN] appUrlOpen listener failed", e)
      );

    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      deepLinkHandle?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
