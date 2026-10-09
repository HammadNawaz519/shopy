"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

interface GoogleButtonProps {
  redirect?: string | null;
  text?: string;
}

export default function GoogleButton({
  redirect,
  text = "Continue with Google",
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Set true once the in-app sign-in tab is open so polling can begin / UI can change.
  const nativeFlowRef = useRef(false);

  /**
   * CLASSIC WEB FLOW: the whole OAuth round-trip happens in this window,
   * so the session cookie lands in the same browser that is viewing the app.
   */
  const handleGoogleSignIn = () => {
    if (loading) return;
    setLoading(true);
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
   * tab (Chrome Custom Tab, stays branded in-app), and because that tab has a
   * separate cookie jar we hand the issued session back to the app via a
   * one-time server-side handoff record that this WebView polls for.
   */
  const handleNativeGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Ask the server for a signed, URL-carried auth URL. The handoff id
      //    ties this sign-in to THIS WebView so only it can collect the result.
      const handoffId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `h_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const params = new URLSearchParams({ native: "1", handoff: handoffId });
      if (redirect) params.set("redirect", redirect);
      const startRes = await fetch(`/api/auth/google?${params.toString()}`);
      if (!startRes.ok) throw new Error("auth_start_failed");
      const { authUrl } = await startRes.json();
      if (!authUrl || !authUrl.startsWith("https://accounts.google.com/")) {
        throw new Error("auth_start_failed");
      }

      // 2. Open the sign-in flow in the in-app browser tab.
      nativeFlowRef.current = true;
      await Browser.open({ url: authUrl });

      // 3. Poll the one-time handoff until the tab sign-in completes.
      const deadline = Date.now() + 4 * 60 * 1000; // 4 minutes
      while (Date.now() < deadline) {
        // Only keep polling while the native flow is still the active one
        // (user hasn't navigated away or closed the app screen).
        if (!nativeFlowRef.current) return;

        await new Promise((r) => setTimeout(r, 1500));

        const pollRes = await fetch(
          `/api/auth/google/handoff?handoffId=${encodeURIComponent(handoffId)}`,
          { credentials: "same-origin" }
        );
        if (pollRes.status === 200) {
          const data = await pollRes.json().catch(() => ({}));
          if (data?.status === "complete") {
            window.location.href = data.destinationPath || "/account";
            return;
          }
          // 409 consumed / other: surface a friendly retry prompt.
          setErrorMsg("Sign-in did not complete. Please try again.");
          setLoading(false);
          return;
        }
        // 202 pending → keep waiting.
      }

      // Timed out without the tab finishing.
      setErrorMsg("Sign-in did not complete. Please try again.");
      setLoading(false);
    } catch {
      setErrorMsg("Sign-in did not complete. Please try again.");
      setLoading(false);
    }
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
    };
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
            <span>Connecting to Google...</span>
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
        <p className="text-[11px] tracking-wider text-red-700/80 uppercase mt-2 text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
