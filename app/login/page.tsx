"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { isValidRedirectUrl } from "@/lib/security/sanitize";
import GoogleButton from "@/components/auth/GoogleButton";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const errorParam = searchParams.get("error");
  const { user, loading: authLoading, login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "Sign In | SHOPY";
  }, []);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") {
        window.location.replace("/admin");
      } else if (isValidRedirectUrl(redirect)) {
        window.location.replace(redirect!);
      } else {
        window.location.replace("/account");
      }
    }
  }, [user, authLoading, redirect]);

  useEffect(() => {
    if (errorParam) {
      if (errorParam === "google_cancelled") {
        setErrorMessage("Google sign-in was cancelled.");
      } else if (errorParam === "email_not_verified") {
        setErrorMessage("Your Google email is not verified. Please verify your Google email first.");
      } else if (errorParam === "invalid_state") {
        setErrorMessage("Security token mismatch. Please try signing in with Google again.");
      } else {
        setErrorMessage("Unable to sign in with Google. Please try again.");
      }
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      showToast("Welcome back to SHOPY", "success");
      if (res.user?.role === "admin") {
        window.location.replace("/admin");
      } else if (isValidRedirectUrl(redirect)) {
        window.location.replace(redirect!);
      } else {
        window.location.replace("/account");
      }
    } else {
      setErrorMessage(res.error || "Login failed");
      showToast(res.error || "Login failed", "error");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
          Sign In
        </h1>
        <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-2">
          Access your order history, profile and atelier preferences.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 shadow-sm space-y-6">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide">
            {errorMessage}
          </div>
        )}

        {/* 1. Google One-Click Sign-In */}
        <div>
          <GoogleButton redirect={redirect} text="Continue with Google" />
        </div>

        {/* Subtle Minimalist Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#BBBFCA]/40" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-[#495464]/60">
            <span className="bg-[#E8E8E8] px-3 font-medium">or email and password</span>
          </div>
        </div>

        {/* 2. Standard Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
              />
            </div>
            <div className="text-right mt-2">
              <Link
                href="/forgot-password"
                className="text-[10.5px] uppercase tracking-widest text-[#495464]/70 hover:text-[#495464] underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-[#495464] text-[#F4F4F2] py-3.5 px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md disabled:opacity-50 text-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="truncate">Sign In to Account</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs tracking-wider uppercase text-[#495464]/70">
        <span>New to SHOPY? </span>
        <Link href="/register" className="text-[#495464] font-semibold underline ml-1">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="pt-20 pb-16 min-h-[calc(100vh-4rem)] bg-[#F4F4F2] text-[#495464] flex items-center justify-center">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#495464] mx-auto" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
