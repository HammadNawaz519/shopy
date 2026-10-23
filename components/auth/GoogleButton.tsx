"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Capacitor, registerPlugin } from "@capacitor/core";

interface GoogleButtonProps {
  redirect?: string | null;
  text?: string;
}

interface NativeGoogleAuthPlugin {
  signIn(options: { serverClientId: string }): Promise<{ idToken: string }>;
}

const NativeGoogleAuth = registerPlugin<NativeGoogleAuthPlugin>("NativeGoogleAuth");

export default function GoogleButton({
  redirect,
  text = "Continue with Google",
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleWebSignIn = () => {
    const target = redirect
      ? `/api/auth/google?redirect=${encodeURIComponent(redirect)}`
      : "/api/auth/google";
    window.location.href = target;
  };

  const fetchGoogleConfig = async () => {
    const configResponse = await fetch("/api/auth/google/config", {
      cache: "no-store",
    });
    if (!configResponse.ok) {
      throw new Error(`Google config unavailable (HTTP ${configResponse.status})`);
    }
    return (await configResponse.json()) as {
      clientId?: string;
      androidClientId?: string;
      configured?: boolean;
    };
  };

  const handleNativeSignIn = async (serverClientId: string) => {
    // Stage 1: the in-app Google Credential Manager provider.
    const credential = await NativeGoogleAuth.signIn({ serverClientId });
    if (!credential?.idToken) {
      throw new Error("Google did not return a credential");
    }

    // Stage 2: exchange the ID token for a SHOPY session (same origin).
    const response = await fetch("/api/auth/google/native", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential.idToken, redirect }),
    });
    let data: { destinationPath?: string; error?: string; reason?: string } = {};
    try {
      data = (await response.json()) as typeof data;
    } catch {
      // non-JSON body
    }
    if (!response.ok) {
      // Propagate the specific server reason so the caller can show it.
      throw new Error(
        `Server rejected Google credential (HTTP ${response.status}: ${
          data.reason || data.error || "unknown_error"
        })`
      );
    }
    window.location.href = data.destinationPath || "/account";
  };

  // Turn a raw failure into a precise, actionable message. Every branch maps
  // to a distinct stage so the exact break point is visible on screen instead
  // of a generic "please try again".
  const describeError = (detail: string): string => {
    const d = detail.toLowerCase();
    if (d.includes("credential provider cancelled")) {
      return "Sign in failed, please try again.";
    }
    if (d.includes("server rejected google credential")) {
      // e.g. "Server rejected Google credential (HTTP 401: audience_mismatch)"
      const m = detail.match(/\((HTTP \d+: ([a-z_]+))\)/i);
      const reason = m ? m[2] : "";
      if (reason === "email_not_verified") {
        return "Your Google email is not verified. Verify it in your Google account, then try again.";
      }
      if (reason === "audience_mismatch" || reason === "invalid_token") {
        return "The server could not validate the Google token. Confirm GOOGLE_CLIENT_ID is the Web OAuth client and the app is redeployed.";
      }
      return `Sign-in did not complete (${reason || "server error"}). Check the server's Google OAuth environment and redeploy.`;
    }
    if (d.includes("no credential")) {
      return "No Google account is signed in on this device. Add one, then retry.";
    }
    if (d.includes("cancelled")) {
      return "Google sign-in was cancelled.";
    }
    if (d.includes("config unavailable") || d.includes("not configured")) {
      return "The server has Google sign-in turned off (client id missing). Set GOOGLE_CLIENT_ID on Vercel and redeploy.";
    }
    // Unknown: surface the raw detail so the exact cause is visible.
    return `Google sign-in failed: ${detail}`;
  };

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    // In-app (Capacitor Android) the ONLY way to establish a session inside
    // this app is the native Credential Manager — the web-OAuth redirect would
    // complete in the external browser and the session cookie would NOT reach
    // this WebView. So in-app we must never fall back to handleWebSignIn.
    const isApp = Capacitor.getPlatform() === "android";
    const nativeAvailable =
      isApp && Capacitor.isPluginAvailable("NativeGoogleAuth");

    if (!isApp) {
      // Desktop / mobile browser: classic web-OAuth is correct and works.
      handleWebSignIn();
      setLoading(false);
      return;
    }

    // isApp === true from here on.
    try {
      if (!nativeAvailable) {
        setErrorMsg(
          "The in-app Google plugin is not available in this build. Install the latest APK, then retry."
        );
        setLoading(false);
        return;
      }

      let config: { clientId?: string; androidClientId?: string } | null = null;
      try {
        config = await fetchGoogleConfig();
      } catch (cfgErr) {
        console.error("[GOOGLE-SIGNIN] config fetch failed", cfgErr);
        config = null;
      }

      // Credential Manager must receive the WEB OAuth client ID as
      // serverClientId (Google: "your server's client ID, not your Android
      // client ID"). The Android-type client is only a Google Cloud registry
      // of package + SHA-1; it is never passed into the native request.
      const webClientId = (config?.clientId || "").trim();
      if (!webClientId) {
        setErrorMsg(
          "In-app Google sign-in is not configured on the server yet. Set GOOGLE_CLIENT_ID (the Web OAuth client id) in Vercel, then redeploy."
        );
        setLoading(false);
        return;
      }

      await handleNativeSignIn(webClientId);
      // success navigates; nothing to reset here
    } catch (error) {
      console.error("[GOOGLE-SIGNIN] failed", error);
      const detail = error instanceof Error ? error.message : String(error);
      setErrorMsg(describeError(detail));
      setLoading(false);
    }
  };

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
            <span>Signing in with Google…</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span className="truncate">{text}</span>
          </>
        )}
      </button>
      {errorMsg && <p className="text-[11px] tracking-wider text-red-700/80 uppercase mt-2 text-center">{errorMsg}</p>}
    </div>
  );
}
