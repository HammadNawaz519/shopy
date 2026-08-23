"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Lock, Mail, User, ArrowRight, Loader2, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasLength) {
      setErrorMessage("Please fulfill all password requirements.");
      return;
    }

    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      showToast("Account created successfully. Welcome to SHOPY.", "success");
      router.push("/account");
    } else {
      setErrorMessage(res.error || "Registration failed.");
      showToast(res.error || "Registration failed.", "error");
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
              width={140}
              height={40}
              priority
              className="h-9 w-auto"
            />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
            MEMBERSHIP
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
            Create Account
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-2">
            Join SHOPY to save your preferences and view order status.
          </p>
        </div>

        {/* Form */}
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
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ayaan Malik"
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
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

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
