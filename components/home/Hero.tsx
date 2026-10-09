"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  initialConfig?: {
    heroImage?: string;
    heroSubtitle?: string;
    heroTitle?: string;
    heroCtaText?: string;
    heroCtaLink?: string;
  };
}

export default function Hero({ initialConfig }: HeroProps) {
  const hero = {
    heroImage: initialConfig?.heroImage || "/hero-beige.jpg",
    heroSubtitle: initialConfig?.heroSubtitle || "EDITION 01 • AUTUMN / WINTER 2026",
    heroTitle: initialConfig?.heroTitle || "ARCHITECTURAL ELEGANCE",
    heroCtaText: initialConfig?.heroCtaText || "Explore Collection",
    heroCtaLink: initialConfig?.heroCtaLink || "/products",
  };

  const heroImgSrc = hero.heroImage;

  // The default editorial photo is a wide 16:9 frame. On phones the hero is a
  // tall portrait container, so `object-cover` zoom-crops the wide frame and
  // the shot looks stretched/soft. A portrait 9:16 crop of the same photo
  // fills the mobile hero 1:1 with no zoom — sharp at Retina sizes.
  // Custom admin-configured images keep the classic cover behavior on all
  // breakpoints (their framing is unknown).
  const isDefaultBeige = heroImgSrc === "/hero-beige.jpg";
  const mobileSrc = isDefaultBeige ? "/hero-beige-portrait.jpg" : heroImgSrc;

  const heroImgClass =
    "object-cover object-center transform scale-100 filter brightness-[0.92] contrast-[1.03] transition-transform duration-1000";

  return (
    <section className="relative w-full h-screen min-h-[620px] flex items-center justify-center overflow-hidden bg-[#181a1d] select-none">
      {/* Editorial Hero Photography — Minimalist Warm Beige Architectural Luxury */}
      <div className="absolute inset-0 w-full h-full">
        {/* Mobile: portrait-crop asset, no zoom */}
        <Image
          src={mobileSrc}
          alt="SHOPY Editorial Campaign"
          fill
          priority
          sizes="100vw"
          className={`${heroImgClass} ${isDefaultBeige ? "sm:hidden" : ""}`}
        />
        {/* Desktop & up: original wide asset (unchanged) */}
        {isDefaultBeige && (
          <Image
            src={heroImgSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`${heroImgClass} hidden sm:block`}
          />
        )}
        {/* Soft elegant warm grading overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-black/25" />
      </div>

      {/* Hero Content — Clean, spacious editorial composition */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white flex flex-col items-center justify-center">
        {/* Subtle Edition Tag */}
        <span className="text-[10px] sm:text-[11px] font-light tracking-[0.35em] uppercase text-white/90 mb-4 block">
          {hero.heroSubtitle}
        </span>

        {/* Clean, Spacious Editorial Headline */}
        <h1
          className="font-serif font-light text-white tracking-wide leading-[1.05] mb-8 drop-shadow-sm max-w-3xl"
          style={{
            fontSize: "clamp(2.8rem, 7vw, 6.5rem)",
          }}
        >
          {hero.heroTitle}
        </h1>

        {/* Centered Minimal CTA */}
        <div className="pt-2">
          <Link
            href={hero.heroCtaLink}
            className="group inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 border border-white/70 text-white text-[10px] sm:text-[11px] tracking-wider sm:tracking-[0.25em] uppercase font-light backdrop-blur-xs hover:bg-white hover:text-[#495464] hover:border-white transition-all duration-400 shadow-sm max-w-full text-center"
          >
            <span className="truncate">{hero.heroCtaText}</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-1.5 transition-transform duration-300" />
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
