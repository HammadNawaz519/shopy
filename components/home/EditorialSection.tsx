"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { EditorialQuote } from "@/lib/groq";

const DEFAULT_QUOTE: EditorialQuote = {
  headline: "YOU DON'T DRESS TO BE NOTICED.",
  subHeadline: "YOU DRESS TO BE IMPOSSIBLE TO FORGET.",
  quote: "Presence is psychological leverage. The human subconscious decodes authority, poise, and prestige before a single word is spoken. When your silhouette is undeniable, respect is instantaneous.",
  author: "Maison SHOPY Atelier Philosophy",
  reflection: "Every piece you choose is an unspoken statement of standard. While ordinary garments disappear in hesitation, master-tailored organic fibers and architectural lines activate subconscious confidence and effortless magnetism. Refuse compromise. Elevate your presence today.",
  theme: "The Psychology of Distinction",
  ctaText: "Claim Your Signature Silhouette"
};

export default function EditorialSection() {
  const [quoteData, setQuoteData] = useState<EditorialQuote>(DEFAULT_QUOTE);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchQuote = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/editorial/quote?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.quote && json?.data?.headline) {
          setQuoteData(json.data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch fresh AI quote:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <section className="py-20 lg:py-32 bg-[#E8E8E8] text-[#495464] overflow-hidden select-none border-t border-[#BBBFCA]/40">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Dynamic Psychological & High-Converting Narrative */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-7 lg:pr-8 order-2 lg:order-1">
            
            {/* Minimalist Sub-header & Dynamic Refresh Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#495464] animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#495464]/80 font-semibold">
                  {quoteData.theme || "THE PSYCHOLOGY OF DISTINCTION"}
                </span>
              </div>

              <button
                onClick={fetchQuote}
                disabled={isLoading}
                title="Generate another AI psychological insight"
                className="group inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#495464]/70 hover:text-[#1A1A1A] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#495464] group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">AI Insight</span>
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : "group-hover:rotate-45 transition-transform"}`} />
              </button>
            </div>

            {/* Dynamic Psychological & Magnetic Headline */}
            <h2
              className={`font-serif text-[#495464] leading-[1.08] tracking-tight font-light transition-opacity duration-500 ${
                isLoading ? "opacity-40" : "opacity-100"
              }`}
              style={{ fontSize: "clamp(2.1rem, 4.3vw, 3.5rem)" }}
            >
              {quoteData.headline}
              {quoteData.subHeadline && (
                <>
                  <br />
                  <span className="italic font-normal">{quoteData.subHeadline}</span>
                </>
              )}
            </h2>

            {/* Dynamic AI Psychological Pull-Quote */}
            <blockquote className={`font-serif text-lg sm:text-xl text-[#2B3542] italic font-normal leading-snug transition-opacity duration-500 ${
              isLoading ? "opacity-40" : "opacity-100"
            }`}>
              &ldquo;{quoteData.quote}&rdquo;
            </blockquote>

            {/* Evocative Persuasive Buying Narrative */}
            <div className={`space-y-3.5 pt-2 border-t border-[#BBBFCA]/50 transition-opacity duration-500 ${
              isLoading ? "opacity-40" : "opacity-100"
            }`}>
              <p className="text-xs sm:text-[13px] text-[#495464] leading-relaxed tracking-wide font-light">
                {quoteData.reflection}
              </p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#2B3542] font-semibold">
                Refuse compromise. Elevate your presence today.
              </p>
            </div>

            {/* High-Impact Persuasive CTA */}
            <div className="pt-2">
              <Link
                href="/products"
                className="group inline-flex items-center gap-3.5 px-8 py-4 bg-[#495464] text-[#F4F4F2] text-[11px] tracking-[0.25em] uppercase font-light hover:bg-[#1A1A1A] transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <span>{quoteData.ctaText || "Claim Your Signature Silhouette"}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>

          </div>

          {/* Right Column: Tactile Ultra-Luxury Material Craftsmanship (No Human, No Shop) */}
          <div className="lg:col-span-7 relative aspect-[4/3] sm:aspect-[16/11] bg-[#BBBFCA]/30 overflow-hidden shadow-md order-1 lg:order-2 group">
            <Image
              src="/atelier-still-life.jpg"
              alt="SHOPY Tactile Material & High-Precision Wool Weave Craftsmanship"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center transform group-hover:scale-103 transition-transform duration-700 ease-out"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
