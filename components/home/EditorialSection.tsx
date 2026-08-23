"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function EditorialSection() {
  return (
    <section className="py-24 lg:py-36 bg-[#E8E8E8] text-[#495464] overflow-hidden select-none">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Editorial Text */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6 lg:pr-6 order-2 lg:order-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#495464]/60 font-medium">
              MATERIAL PROVENANCE
            </span>

            <h2
              className="font-serif text-[#495464] leading-[0.95] tracking-tight font-light"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)" }}
            >
              CRAFT &amp; <br />
              <span className="italic font-normal">MATERIALITY</span>
            </h2>

            <p className="font-serif text-lg sm:text-xl text-[#495464]/90 italic font-light leading-snug">
              &ldquo;Long-staple Normandy flax, 280 GSM custom French terry, and Italian full-grain calfskin.&rdquo;
            </p>

            <p className="text-xs text-[#495464]/80 leading-relaxed tracking-wider uppercase max-w-lg">
              Every creation is engineered from the thread level. We develop our fabrics with heavyweight yarn counts and garment wash treatments to guarantee pre-shrunk longevity and a tactile hand feel.
            </p>

            <div className="pt-2">
              <Link
                href="/about"
                className="group inline-flex items-center gap-3 px-6 py-3 border border-[#495464] text-[#495464] text-[11px] tracking-[0.22em] uppercase font-light hover:bg-[#495464] hover:text-[#F4F4F2] transition-all duration-300"
              >
                <span>Discover Atelier Craft</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Right Large Atelier Photography Frame */}
          <div className="lg:col-span-7 relative aspect-[4/3] sm:aspect-[16/10] bg-[#BBBFCA]/30 overflow-hidden shadow-sm order-1 lg:order-2">
            <Image
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=90&w=2000"
              alt="SHOPY Atelier Craft & Materiality"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center"
            />
            <div className="absolute top-6 right-6 text-[9px] tracking-[0.3em] text-white uppercase bg-black/50 px-3 py-1.5 backdrop-blur-xs font-light">
              ATELIER LAHORE • 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
