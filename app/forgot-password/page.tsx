"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "verify" | "complete">("request");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { showToast } = useToast();

  // Step 1: Request 6-Digit OTP via SMTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Verification code dispatched to your email.", "success");
        setStep("verify");
      } else {
        setErrorMessage(data.error || "Failed to send verification code.");
        showToast(data.error || "Failed to send verification code.", "error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      showToast("Passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      showToast("Password must be at least 8 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otpCode: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Password updated successfully.", "success");
        setStep("complete");
      } else {
        setErrorMessage(data.error || "Invalid or expired verification code.");
        showToast(data.error || "Invalid or expired verification code.", "error");
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
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
            {step === "complete"
              ? "Password Reset"
              : step === "verify"
              ? "Enter Verification Code"
              : "Forgot Password"}
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-2">
            {step === "complete"
              ? "Your client account credentials have been updated."
              : step === "verify"
              ? `Check your inbox at ${email}`
              : "Receive a 6-digit verification code to reset your password."}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs tracking-wider">
            {errorMessage}
          </div>
        )}

        {step === "complete" ? (
          <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-8 text-center space-y-4 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
            <h3 className="font-serif text-xl font-medium text-[#495464]">
              Security Verified
            </h3>
            <p className="text-xs text-[#495464]/80 tracking-wider leading-relaxed">
              Your password has been securely reset in our system. You can now sign in with your new credentials.
            </p>
            <Link
              href="/login"
              className="inline-block w-full mt-4 bg-[#495464] text-[#F4F4F2] py-3.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
            >
              Sign In to Account
            </Link>
          </div>
        ) : step === "verify" ? (
          <form
            onSubmit={handleResetPassword}
            className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-6 shadow-sm animate-fadeIn"
          >
            {/* 6-Digit OTP Input */}
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

            {/* New Password */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                />
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
                  <span>Verify &amp; Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-[11px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
              <Link
                href="/login"
                className="text-[11px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464]"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleRequestOtp}
            className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-6 shadow-sm"
          >
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

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#495464]/70 hover:text-[#495464]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
