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

  const handleNativeSignIn = async () => {
    const configResponse = await fetch("/api/auth/google/config", {
      cache: "no-store",
    });
    if (!configResponse.ok) throw new Error("Google sign-in is not configured");
    const config = (await configResponse.json()) as { clientId?: string };
    if (!config.clientId) throw new Error("Google sign-in is not configured");

    const credential = await NativeGoogleAuth.signIn({
      serverClientId: config.clientId,
    });
    if (!credential?.idToken) throw new Error("Google did not return a credential");

    const response = await fetch("/api/auth/google/native", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential.idToken, redirect }),
    });
    const data = (await response.json()) as {
      destinationPath?: string;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(
        `Server rejected Google credential (${response.status}: ${
          data.error || "unknown_error"
        })`
      );
    }
    window.location.href = data.destinationPath || "/account";
  };

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (Capacitor.getPlatform() === "android") {
        await handleNativeSignIn();
      } else {
        handleWebSignIn();
      }
    } catch (error) {
      console.error("[GOOGLE-SIGNIN] failed", error);
      const detail = error instanceof Error ? error.message : String(error);
      const normalizedDetail = detail.toLowerCase();
      if (normalizedDetail.includes("cancelled")) {
        setErrorMsg("Google sign-in was cancelled.");
      } else if (normalizedDetail.includes("no credential")) {
        setErrorMsg("No Google account is available on this device.");
      } else {
        console.error("[GOOGLE-SIGNIN] diagnostic", detail);
        setErrorMsg("Google sign-in failed. Please try again.");
      }
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
