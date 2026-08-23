"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { isValidRedirectUrl } from "@/lib/security/sanitize";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      showToast("Welcome back to SHOPY", "success");
      if (res.user?.role === "admin") {
        window.location.href = "/admin";
      } else if (isValidRedirectUrl(redirect)) {
        window.location.href = redirect!;
      } else {
        window.location.href = "/account";
      }
    } else {
      setErrorMessage(res.error || "Login failed");
      showToast(res.error || "Login failed", "error");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-6">
      {/* Centered Brand Signature */}
      <div className="flex justify-center mb-8">
        <Link href="/" className="font-serif text-2xl tracking-[0.35em] font-light text-[#495464] hover:opacity-85 transition-opacity">
          SHOPY
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
          CLIENT ACCESS
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
          Sign In
        </h1>
        <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-2">
          Access your order history, profile and atelier preferences.
        </p>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-6 shadow-sm"
      >
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide">
            {errorMessage}
          </div>
        )}

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
              placeholder="••••••••"
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
          className="w-full flex items-center justify-center gap-3 bg-[#495464] text-[#F4F4F2] py-3.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

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
    <div className="pt-32 pb-32 bg-[#F4F4F2] text-[#495464] flex items-center justify-center">
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
