"use client";

import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubscribed(true);
        showToast(data.message || "Thank you for subscribing to SHOPY releases.", "success");
        setEmail("");
      } else {
        showToast(data.error || "Subscription failed.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 lg:py-32 bg-[#F4F4F2] text-[#495464] border-t border-[#BBBFCA]/30">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#495464] mb-4">
          STAY IN THE LOOP
        </h2>

        <p className="text-xs sm:text-sm text-[#495464]/90 tracking-wider uppercase max-w-md mx-auto mb-10 leading-relaxed">
          Receive private access to seasonal drops, intimate editorial lookbooks, and atelier previews.
        </p>

        {subscribed ? (
          <div className="inline-flex items-center gap-2 bg-[#E8E8E8] border border-[#BBBFCA]/40 px-6 py-4 text-xs tracking-widest uppercase text-[#495464] animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>You are on the private list. Look out for our upcoming dispatch.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex">
            <input
              type="email"
              required
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-[#E8E8E8] border border-[#BBBFCA] px-5 py-3.5 text-xs tracking-wider text-[#495464] placeholder:text-[#495464]/50 focus:outline-none focus:border-[#495464] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#495464] text-[#F4F4F2] px-6 py-3.5 hover:bg-[#363E4B] transition-colors disabled:opacity-50 flex items-center justify-center"
              aria-label="Subscribe to newsletter"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-[10px] text-[#495464]/90 tracking-widest uppercase mt-4">
          We respect your digital calm. Unsubscribe with one click anytime.
        </p>
      </div>
    </section>
  );
}
