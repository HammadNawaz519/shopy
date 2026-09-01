"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

interface EditorialSectionProps {
  initialQuote?: EditorialQuote;
}

export default function EditorialSection({ initialQuote }: EditorialSectionProps) {
  const [quoteData, setQuoteData] = useState<EditorialQuote>(initialQuote || DEFAULT_QUOTE);

  useEffect(() => {
    if (initialQuote) {
      setQuoteData(initialQuote);
    }
  }, [initialQuote]);

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#E8E8E8] text-[#495464] overflow-hidden select-none border-t border-[#BBBFCA]/40">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Dynamic Psychological & High-Converting Narrative */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-5 sm:space-y-6 order-2 lg:order-1">
            
            {/* Minimalist Sub-header with Solid Dark Static Dot */}
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#181a1d] flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#495464]/80 font-semibold font-mono">
                {quoteData.theme || "THE PSYCHOLOGY OF DISTINCTION"}
              </span>
            </div>

            {/* Dynamic Psychological & Magnetic Headline */}
            <h2
              className="font-serif text-[#181a1d] leading-[1.12] tracking-tight font-light transition-opacity duration-500 text-2xl sm:text-3xl lg:text-[2.2rem] opacity-100"
            >
              {quoteData.headline}
              {quoteData.subHeadline && (
                <>
                  <br />
                  <span className="italic font-normal text-[#495464]">{quoteData.subHeadline}</span>
                </>
              )}
            </h2>

            {/* Dynamic AI Psychological Pull-Quote */}
            <blockquote className="font-serif text-sm sm:text-base text-[#2B3542] italic font-normal leading-relaxed transition-opacity duration-500 opacity-100">
              &ldquo;{quoteData.quote}&rdquo;
            </blockquote>

            {/* High-Impact Persuasive CTA */}
            <div className="pt-2">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2.5 sm:gap-3 px-5 sm:px-7 py-3 sm:py-3.5 bg-[#495464] text-[#F4F4F2] text-[10px] tracking-wider sm:tracking-[0.22em] uppercase font-medium hover:bg-[#1A1A1A] transition-all duration-300 shadow-sm max-w-full text-center"
              >
                <span className="truncate">{quoteData.ctaText || "Claim Your Signature Silhouette"}</span>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>

          </div>

          {/* Right Column: Tactile Ultra-Luxury Material Craftsmanship (No Human, No Shop) */}
          <div className="lg:col-span-7 relative aspect-[4/3] sm:aspect-[16/11] bg-[#BBBFCA]/20 overflow-hidden shadow-sm border border-[#BBBFCA]/30 order-1 lg:order-2 group">
            <Image
              src="/atelier-still-life.jpg?v=2"
              alt="SHOPY Tactile Material & High-Precision Wool Weave Craftsmanship"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center transform group-hover:scale-102 transition-transform duration-700 ease-out"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
