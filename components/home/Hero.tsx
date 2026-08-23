"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full h-[94vh] min-h-[620px] max-h-[1100px] flex items-center justify-center overflow-hidden bg-[#181a1d] select-none">
      {/* Editorial Hero Photography — Rich, warm color fashion editorial */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=95&w=2400"
          alt="SHOPY Editorial Autumn Winter Campaign"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transform scale-105 filter brightness-[0.88] contrast-[1.02] transition-transform duration-1000"
        />
        {/* Soft, delicate contrast gradient preserving full color warmth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35" />
      </div>

      {/* Hero Content — Clean, spacious editorial composition */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white flex flex-col items-center justify-center">
        {/* Subtle Edition Tag */}
        <span className="text-[10px] sm:text-[11px] font-light tracking-[0.35em] uppercase text-white/90 mb-4 block">
          EDITION 01 • AUTUMN / WINTER 2026
        </span>

        {/* Clean, Spacious Editorial Headline */}
        <h1
          className="font-serif font-light text-white tracking-wide leading-[1.05] mb-8 drop-shadow-sm max-w-3xl"
          style={{
            fontSize: "clamp(2.8rem, 7vw, 6.5rem)",
          }}
        >
          ARCHITECTURAL <span className="italic font-normal">ELEGANCE</span>
        </h1>

        {/* Centered Minimal CTA */}
        <div className="pt-2">
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 px-8 py-3.5 border border-white/70 text-white text-[11px] tracking-[0.25em] uppercase font-light backdrop-blur-xs hover:bg-white hover:text-[#495464] hover:border-white transition-all duration-400 shadow-sm"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Delicate Bottom Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-[9px] tracking-[0.3em] uppercase text-white font-light">
          Scroll
        </span>
        <div className="w-[1px] h-4 bg-white/60" />
      </div>
    </section>
  );
}
