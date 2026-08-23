"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { Lock, Mail, User, ArrowRight, Loader2, Check, KeyRound, RefreshCw, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8;

  // Step 1: Submit Details & Request OTP via SMTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasLength) {
      setErrorMessage("Please fulfill all password requirements.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.requiresOtp || data.success)) {
        showToast("Verification code dispatched to your email.", "success");
        setStep("verify");
      } else {
        setErrorMessage(data.error || "Registration failed.");
        showToast(data.error || "Registration failed.", "error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP & Complete Registration / Sign-In
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (otpCode.trim().length < 6) {
      setErrorMessage("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          otpCode: otpCode.trim(),
          action: "verify",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Account verified successfully. Welcome to SHOPY.", "success");
        if (data.user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/account");
        }
      } else {
        setErrorMessage(data.error || "Invalid verification code.");
        showToast(data.error || "Invalid verification code.", "error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-32 bg-[#F4F4F2] text-[#495464] flex items-center justify-center">
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
            {step === "verify" ? "SECURITY VERIFICATION" : "MEMBERSHIP"}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
            {step === "verify" ? "Enter Code" : "Create Account"}
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-2">
            {step === "verify"
              ? `Check your inbox at ${email}`
              : "Join SHOPY to access your orders and atelier preferences."}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide">
            {errorMessage}
          </div>
        )}

        {step === "verify" ? (
          /* Step 2: OTP Verification Form */
          <form
            onSubmit={handleVerifyOtp}
            className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-6 shadow-sm animate-fadeIn"
          >
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
                6-Digit Verification Code *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 749210"
                  className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-sm font-mono tracking-widest text-[#495464] focus:outline-none focus:border-[#495464]"
                />
              </div>
              <p className="text-[10px] text-[#495464]/60 mt-1">Dispatched from shopy.otp@gmail.com</p>
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
                  <span>Verify &amp; Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-[11px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Edit Details</span>
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-[11px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 1: Initial Registration Details */
          <form
            onSubmit={handleRequestOtp}
            className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-6 shadow-sm"
          >
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hammad Nawaz"
                  className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                />
              </div>
            </div>

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
                  placeholder="hammadnawaz276@gmail.com"
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

              {/* Password Validation Indicators */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-[#495464]/70 tracking-wider">
                <span className={`flex items-center gap-1 ${hasLength ? "text-emerald-700 font-medium" : ""}`}>
                  <Check className={`w-3 h-3 ${hasLength ? "opacity-100" : "opacity-30"}`} />
                  8+ Characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpperCase ? "text-emerald-700 font-medium" : ""}`}>
                  <Check className={`w-3 h-3 ${hasUpperCase ? "opacity-100" : "opacity-30"}`} />
                  Uppercase Letter
                </span>
                <span className={`flex items-center gap-1 ${hasLowerCase ? "text-emerald-700 font-medium" : ""}`}>
                  <Check className={`w-3 h-3 ${hasLowerCase ? "opacity-100" : "opacity-30"}`} />
                  Lowercase Letter
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-700 font-medium" : ""}`}>
                  <Check className={`w-3 h-3 ${hasNumber ? "opacity-100" : "opacity-30"}`} />
                  Number
                </span>
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
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs tracking-wider uppercase text-[#495464]/70">
          <span>Already have an account? </span>
          <Link href="/login" className="text-[#495464] font-semibold underline ml-1">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
