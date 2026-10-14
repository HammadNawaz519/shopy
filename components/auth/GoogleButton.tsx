"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

interface GoogleButtonProps {
  redirect?: string | null;
  text?: string;
}

/**
 * Pending native handoffs are persisted so the sign-in can finish automatically:
 *  - If the app's WebView is suspended while the user signs in the Google tab
 *    (iOS freezes background timers), polling resumes when the app regains
 *    focus (visibilitychange / focus).
 *  - If the user closes the app entirely and reopens it, the component mounts
 *    with the stored record and auto-completes + redirects with no re-click.
 */
const HANDOFF_STORAGE_KEY = "shopy_google_native_handoff";
const HANDOFF_TTL_MS = 10 * 60 * 1000; // matches the server-side 5-min record TTL + slack

interface StoredHandoff {
  handoffId: string;
  redirect: string | null;
  startedAt: number;
}

function readStoredHandoff(): StoredHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as Partial<StoredHandoff>;
    if (!rec || typeof rec.handoffId !== "string" || rec.handoffId.length < 8) return null;
    const startedAt = typeof rec.startedAt === "number" ? rec.startedAt : 0;
    if (startedAt > 0 && Date.now() - startedAt > HANDOFF_TTL_MS) {
      window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
      return null;
    }
    return { handoffId: rec.handoffId, redirect: rec.redirect ?? null, startedAt };
  } catch {
    return null;
  }
}

function storeHandoff(rec: StoredHandoff) {
  try {
    window.localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(rec));
  } catch {
    /* storage full / private mode — polling for the current session still works */
  }
}

function clearStoredHandoff() {
  try {
    window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

type PollOutcome = "complete" | "pending" | "stopped";

export default function GoogleButton({
  redirect,
  text = "Continue with Google",
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Temporary diagnostics: the OAuth step that last succeeded / failed. Rendered
  // as a small detail line and mirrored to console.log. Contains no credentials.
  const [diag, setDiag] = useState<string | null>(null);
  // Set true once the in-app sign-in tab is open so polling can begin / UI can change.
  const nativeFlowRef = useRef(false);
  // Mirrors `loading` for use inside stable callbacks.
  const loadingRef = useRef(false);
  // A resume-poll driven by the stored record is in flight.
  const resumePollRef = useRef(false);

  const logStep = (step: string, detail?: unknown) => {
    const suffix =
      detail === undefined
        ? ""
        : typeof detail === "string"
          ? ` ${detail}`
          : ` ${JSON.stringify(detail)}`;
    console.log(`[GOOGLE-SIGNIN] ${step}${suffix}`);
  };

  /**
   * Poll the one-time handoff until the sign-in tab completes it.
   *  - "complete" → caller navigates away (window.location.href already set)
   *  - "pending"  → deadline reached with no record yet (user may still be signing in)
   *  - "stopped"  → flow no longer active / record already finished elsewhere
   */
  const pollHandoff = async (
    handoffId: string,
    deadline: number,
    isActive: () => boolean
  ): Promise<PollOutcome> => {
    let lastStatus: number | null = null;
    while (Date.now() < deadline) {
      if (!isActive()) return "stopped";

      await new Promise((r) => setTimeout(r, 1500));

      let pollRes: Response;
      try {
        pollRes = await fetch(
          `/api/auth/google/handoff?handoffId=${encodeURIComponent(handoffId)}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }
        );
      } catch (netErr) {
        logStep("POLL: fetch threw (retrying)", { message: (netErr as Error)?.message });
        continue;
      }

      if (pollRes.status !== lastStatus) {
        logStep(`NATIVE GOOGLE POLL handoffId=${handoffId} status=${pollRes.status}`);
        logStep("POLL: status", {
          status: pollRes.status,
          meaning:
            pollRes.status === 200
              ? "complete"
              : pollRes.status === 202
                ? "pending"
                : pollRes.status === 409
                  ? "handoff_consumed"
                  : "other",
        });
        lastStatus = pollRes.status;
      }

      if (pollRes.status === 200) {
        let data: { status?: string; destinationPath?: string };
        try {
          data = await pollRes.json();
        } catch {
          logStep("POLL: 200 but body was not JSON");
          data = {};
        }
        if (data?.status === "complete") {
          logStep("SESSION: created", {
            destinationPath: data.destinationPath || "/account",
          });
          clearStoredHandoff();
          window.location.href = data.destinationPath || "/account";
          return "complete";
        }
        logStep("POLL: 200 but status !== complete", { got: data?.status });
        return "stopped";
      }

      // 409 = another poll already consumed it, 400 = record gone/expired.
      // If our own WebView is already authenticated (the consumed handoff DID
      // set the session cookie before), finish from there instead of stalling.
      if (pollRes.status === 409 || pollRes.status === 400) {
        logStep("POLL: handoff no longer consumable — probing /api/auth/me");
        let me: { user?: { role?: string } | null } = {};
        try {
          const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
          me = await meRes.json();
        } catch {
          me = {};
        }
        if (me.user) {
          logStep("SESSION: already active — navigating");
          const stored = readStoredHandoff();
          clearStoredHandoff();
          window.location.href =
            me.user.role === "admin" ? "/admin" : stored?.redirect || "/account";
          return "complete";
        }
        clearStoredHandoff();
        return "stopped";
      }
      if (pollRes.status >= 500) {
        logStep("POLL: server error", { status: pollRes.status });
        return "stopped";
      }
      // 202 / 404 → keep waiting until the deadline.
    }
    return "pending";
  };

  /**
   * CLASSIC WEB FLOW: the whole OAuth round-trip happens in this window,
   * so the session cookie lands in the same browser that is viewing the app.
   */
  const handleGoogleSignIn = () => {
    if (loading) return;
    setLoading(true);
    loadingRef.current = true;
    setErrorMsg(null);

    let targetUrl = "/api/auth/google";
    if (redirect) {
      targetUrl += `?redirect=${encodeURIComponent(redirect)}`;
    }

    window.location.href = targetUrl;
  };

  /**
   * NATIVE (CAPACITOR) FLOW: Google's sign-in screen refuses embedded
   * WebViews and bounces to the system Chrome — which is why users ended up
   * "using the app in Chrome". Instead we open Google in the in-app browser
   * tab (Chrome Custom Tab / SFSafariViewController, stays branded in-app), and
   * because that tab has a separate cookie jar we hand the issued session back
   * to the app via a one-time server-side handoff record that this WebView
   * polls for. The pending record is persisted so sign-in can ALWAYS auto-
   * complete: on app refocus, or after the app was closed and reopened.
   */
  const handleNativeGoogleSignIn = async () => {
    if (loading || loadingRef.current) return;
    setLoading(true);
    loadingRef.current = true;
    setErrorMsg(null);
    setDiag(null);

    // Terminal failure: record which step broke, show the friendly message, stop.
    const fail = (step: string, reason: string) => {
      logStep("FAIL", { step, reason });
      setDiag(`${step}: ${reason}`);
      setErrorMsg("Sign-in did not complete. Please try again.");
      setLoading(false);
      loadingRef.current = false;
    };

    try {
      // 1. Ask the server for a signed, URL-carried auth URL. The handoff id
      //    ties this sign-in to THIS WebView so only it can collect the result.
      const handoffId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `h_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      logStep("START: handoffId created", {
        length: handoffId.length,
        prefix: handoffId.slice(0, 8),
      });

      // Persist immediately so a closed/suspended app can still auto-finish.
      storeHandoff({ handoffId, redirect: redirect ?? null, startedAt: Date.now() });

      const params = new URLSearchParams({ native: "1", handoff: handoffId });
      if (redirect) params.set("redirect", redirect);

      // STEP 1 — START: fetch the signed Google auth URL.
      let startRes: Response;
      try {
        startRes = await fetch(`/api/auth/google?${params.toString()}`);
      } catch (netErr) {
        logStep("START: fetch threw", { message: (netErr as Error)?.message });
        fail("START", "network error reaching /api/auth/google");
        return;
      }
      if (!startRes.ok) {
        fail("START", `/api/auth/google returned ${startRes.status}`);
        return;
      }

      let startJson: { authUrl?: unknown };
      try {
        startJson = await startRes.json();
      } catch (jsonErr) {
        logStep("START: response was NOT JSON", {
          status: startRes.status,
          contentType: startRes.headers.get("content-type"),
          message: (jsonErr as Error)?.message,
        });
        fail("START", "auth URL request did not return JSON");
        return;
      }

      // STEP 2 — GOOGLE URL: validate the returned authorize URL (full URL not logged).
      const authUrl = startJson.authUrl;
      const googleHostOk =
        typeof authUrl === "string" && authUrl.startsWith("https://accounts.google.com/");
      if (!googleHostOk) {
        fail("GOOGLE URL", "authUrl missing or not an accounts.google.com URL");
        return;
      }

      // STEP 3 — BROWSER: open the sign-in tab in the in-app browser.
      nativeFlowRef.current = true;
      const browserFinishedListener = await Browser.addListener("browserFinished", () => {
        logStep("BROWSER: sign-in tab closed; handoff polling continues");
      });
      try {
        await Browser.open({ url: authUrl });
        logStep("BROWSER: Browser.open resolved (tab opened)");
      } catch (browserErr) {
        await browserFinishedListener.remove();
        logStep("BROWSER: Browser.open threw", {
          message: (browserErr as Error)?.message,
        });
        fail("BROWSER", "in-app browser tab failed to open");
        return;
      }

      // STEP 4 — POLL the one-time handoff until the tab sign-in completes.
      const outcome = await pollHandoff(
        handoffId,
        Date.now() + 9 * 60 * 1000,
        () => nativeFlowRef.current
      );
      await browserFinishedListener.remove();

      if (outcome === "complete") return; // already navigated away
      if (outcome === "stopped") {
        fail("POLL", "handoff was not completed");
        return;
      }

      // "pending": the tab never produced a consumable handoff within the
      // window. The record stays persisted — returning to the app (or
      // reopening it) auto-resumes and finishes the sign-in.
      logStep("POLL: window elapsed, keeping record for auto-resume");
      setDiag("Sign-in in progress — it will finish automatically when you return to SHOPY.");
      setErrorMsg("If you signed in, close the Google tab and go back to the app.");
      setLoading(false);
      loadingRef.current = false;
    } catch (err) {
      logStep("UNCAUGHT error", { message: (err as Error)?.message });
      fail("UNCAUGHT", (err as Error)?.message || "unknown error");
    }
  };

  /**
   * AUTO-RESUME: pick up a persisted handoff without re-clicking. Runs on mount
   * (covers the closed-then-reopened app) and every time the WebView regains
   * focus (covers the suspended-while-signing-in case).
   */
  const resumeStoredHandoff = () => {
    if (resumePollRef.current || loadingRef.current) return;
    const rec = readStoredHandoff();
    if (!rec) return;
    resumePollRef.current = true;
    setLoading(true);
    loadingRef.current = true;
    setDiag("Resuming Google sign-in…");
    logStep("RESUME: polling stored handoff", { age: Date.now() - rec.startedAt });
    pollHandoff(rec.handoffId, Date.now() + 9 * 60 * 1000, () => resumePollRef.current).then(
      (outcome) => {
        if (outcome === "complete") return; // already navigated away
        resumePollRef.current = false;
        setLoading(false);
        loadingRef.current = false;
        if (outcome === "stopped") {
          setErrorMsg("Sign-in did not complete. Please try again.");
        } else {
          setDiag("Still signing in — finish in the Google tab and it will complete here automatically.");
          setErrorMsg("Sign-in in progress — it will finish automatically when you return to SHOPY.");
        }
      }
    );
  };

  const onClick = () => {
    if (Capacitor.isNativePlatform()) {
      handleNativeGoogleSignIn();
    } else {
      handleGoogleSignIn();
    }
  };

  // Safety net: if the component unmounts (navigated away), stop polling.
  useEffect(() => {
    return () => {
      nativeFlowRef.current = false;
      resumePollRef.current = false;
    };
  }, []);

  // Auto-resume on mount + whenever the app's WebView becomes visible/focused.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    resumeStoredHandoff();
    const onWake = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      resumeStoredHandoff();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-[#F4F4F2] hover:bg-[#E8E8E8] text-[#495464] border border-[#BBBFCA] py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed select-none group text-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#495464]" />
            <span>Connecting to Google…</span>
          </>
        ) : (
          <>
            {/* Official Google "G" SVG Icon */}
            <svg
              className="w-4 h-4 flex-shrink-0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span className="truncate">{text}</span>
          </>
        )}
      </button>
      {errorMsg && (
        <>
          <p className="text-[11px] tracking-wider text-red-700/80 uppercase mt-2 text-center">
            {errorMsg}
          </p>
          {diag && (
            <p className="text-[10px] text-red-700/60 mt-1 text-center font-mono break-words">
              {diag}
            </p>
          )}
        </>
      )}
    </div>
  );
}
