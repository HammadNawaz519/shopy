"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      setSubmitted(true);
      showToast(data.message || "Instructions sent.", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-32 bg-[#F4F4F2] text-[#495464] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        {/* Centered Brand Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <Image
              src="/logo.svg"
              alt="SHOPY"
              width={130}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            ACCOUNT RECOVERY
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
            Forgot Password
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-2">
            Enter your email to receive recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-8 text-center space-y-4 animate-fadeIn">
            <CheckCircle2 className="w-8 h-8 text-[#495464] mx-auto" />
            <h3 className="font-serif text-lg font-medium text-[#495464]">
              Instructions Dispatched
            </h3>
            <p className="text-xs text-[#495464]/80 tracking-wider">
              If an account is associated with <span className="font-semibold">{email}</span>, you will receive a secure recovery link.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-xs uppercase tracking-widest font-medium text-[#495464] underline"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
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
                  <span>Send Recovery Instructions</span>
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
