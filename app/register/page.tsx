"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Lock, Mail, User, KeyRound, ArrowRight, ArrowLeft, Loader2, Check, RefreshCw, CheckCircle2 } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";

export default function RegisterPage() {
  const { register, verifyRegisterOtp, resendRegisterOtp } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<"details" | "verify" | "complete">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8;

  // Step 1: Submit Details & Request OTP
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasLength) {
      setErrorMessage("Please fulfill all password security requirements.");
      showToast("Please fulfill all password security requirements.", "error");
      return;
    }

    setLoading(true);
    const res = await register(name.trim(), email.trim(), password);
    setLoading(false);

    if (res.success) {
      if (res.requiresOtp) {
        showToast("6-digit verification code dispatched to your email.", "success");
        setStep("verify");
      } else {
        showToast("Account created successfully. Welcome to SHOPY.", "success");
        if (res.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/account";
        }
      }
    } else {
      setErrorMessage(res.error || "Registration failed.");
      showToast(res.error || "Registration failed.", "error");
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      showToast("Please enter the 6-digit verification code.", "error");
      return;
    }

    setLoading(true);
    const res = await verifyRegisterOtp(email.trim(), otpCode.trim());
    setLoading(false);

    if (res.success && res.user) {
      showToast("Account verified successfully! Welcome to SHOPY.", "success");
      setStep("complete");
      setTimeout(() => {
        if (res.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/account";
        }
      }, 1200);
    } else {
      setErrorMessage(res.error || "Invalid or expired verification code.");
      showToast(res.error || "Invalid or expired verification code.", "error");
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setResending(true);
    const res = await resendRegisterOtp(email.trim());
    setResending(false);

    if (res.success) {
      showToast("A new verification code has been dispatched.", "success");
    } else {
      showToast(res.error || "Failed to resend verification code.", "error");
    }
  };

  return (
    <div className="pt-20 pb-16 min-h-[calc(100vh-4rem)] bg-[#F4F4F2] text-[#495464] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
            {step === "complete"
              ? "Account Verified"
              : step === "verify"
              ? "Verify Your Email"
              : "Create Account"}
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-2">
            {step === "complete"
              ? "Welcome to the SHOPY Atelier."
              : step === "verify"
              ? `Enter the 6-digit code sent to ${email}`
              : "Join SHOPY to save your preferences and view order status."}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide">
            {errorMessage}
          </div>
        )}

        {step === "complete" ? (
          <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-8 text-center space-y-4 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
            <h3 className="font-serif text-xl font-medium text-[#495464]">
              Identity Verified
            </h3>
            <p className="text-xs text-[#495464]/80 tracking-wider leading-relaxed">
              Your client account has been confirmed. Redirecting to your dashboard...
            </p>
            <div className="pt-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#495464] mx-auto" />
            </div>
          </div>
        ) : step === "verify" ? (
          /* STEP 2: VERIFICATION CODE FORM */
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
                  autoFocus
                  className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-sm font-mono tracking-widest text-[#495464] focus:outline-none focus:border-[#495464]"
                />
              </div>
              <p className="text-[10px] text-[#495464]/60 mt-1">
                Dispatched from shopy.otp@gmail.com &bull; Expires in 10 mins
              </p>
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
                  <span>Verify &amp; Activate Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[11px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                <span>Resend Code</span>
              </button>
              <button
                type="button"
                onClick={() => setStep("details")}
                className="text-[11px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Edit Details</span>
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: INITIAL REGISTRATION DETAILS FORM */
          <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 space-y-6 shadow-sm">
            {/* Google Quick Sign-Up */}
            <div>
              <GoogleButton text="Sign Up with Google" />
            </div>

            {/* Minimalist Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#BBBFCA]/40" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-[#495464]/60">
                <span className="bg-[#E8E8E8] px-3 font-medium">or register with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmitDetails} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-10 pr-4 py-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1.5 font-medium">
                  Email Address *
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
                  Password *
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
          </div>
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
