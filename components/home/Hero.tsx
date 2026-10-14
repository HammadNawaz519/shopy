"use client";

import React from "react";
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
    heroTextColor?: string;
    heroImageFit?: "cover" | "contain" | "fill";
    heroImagePosition?: "center" | "top" | "bottom";
    heroMobileImage?: string;
  };
}

export default function Hero({ initialConfig }: HeroProps) {
  const hero = {
    heroImage: initialConfig?.heroImage || "/hero-beige.jpg",
    heroSubtitle: initialConfig?.heroSubtitle || "EDITION 01 • AUTUMN / WINTER 2026",
    heroTitle: initialConfig?.heroTitle || "ARCHITECTURAL ELEGANCE",
    heroCtaText: initialConfig?.heroCtaText || "Explore Collection",
    heroCtaLink: initialConfig?.heroCtaLink || "/products",
    heroTextColor: initialConfig?.heroTextColor || "#FFFFFF",
    heroImageFit: initialConfig?.heroImageFit || "cover",
    heroImagePosition: initialConfig?.heroImagePosition || "center",
    heroMobileImage: initialConfig?.heroMobileImage || "",
  };

  const heroImgSrc = hero.heroImage;
  const isDefaultBeige = heroImgSrc === "/hero-beige.jpg";
  const mobileSrc = hero.heroMobileImage || (isDefaultBeige ? "/hero-beige-portrait.jpg" : heroImgSrc);
  const desktopSrc = heroImgSrc;

  const textColor = hero.heroTextColor || "#FFFFFF";
  const fitMode = hero.heroImageFit || "cover";
  const posMode = hero.heroImagePosition || "center";

  // Dynamic object positioning style
  const imageStyle: React.CSSProperties = {
    objectFit: fitMode as any,
    objectPosition: posMode,
  };

  return (
    <section className="relative w-full h-screen min-h-[620px] sm:h-[88vh] sm:min-h-[600px] sm:max-h-[980px] flex items-center justify-center overflow-hidden bg-[#181a1d] select-none">
      {/* Editorial Hero Photography — Minimalist Warm Beige Architectural Luxury */}
      <div className="absolute inset-0 w-full h-full">
        {/* Mobile Viewport Image (< 640px) */}
        <div className="sm:hidden relative w-full h-full">
          <Image
            src={mobileSrc}
            alt="SHOPY Editorial Campaign"
            fill
            priority
            quality={100}
            unoptimized={!isDefaultBeige}
            sizes="100vw"
            style={imageStyle}
            className="filter brightness-[0.94] contrast-[1.02]"
          />
        </div>

        {/* Desktop & Laptop Viewport Image (>= 640px) */}
        <div className="hidden sm:block relative w-full h-full">
          <Image
            src={desktopSrc}
            alt="SHOPY Editorial Campaign"
            fill
            priority
            quality={100}
            unoptimized={!isDefaultBeige}
            sizes="100vw"
            style={imageStyle}
            className="filter brightness-[0.94] contrast-[1.02]"
          />
        </div>

        {/* Soft elegant warm grading overlay - automatically subtle if contain or custom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/30 pointer-events-none" />
      </div>

      {/* Hero Content — Clean, spacious editorial composition */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center">
        {/* Subtle Edition Tag */}
        <span
          className="text-[10px] sm:text-[11px] font-light tracking-[0.35em] uppercase mb-4 block drop-shadow-sm transition-colors duration-300"
          style={{ color: textColor, opacity: 0.9 }}
        >
          {hero.heroSubtitle}
        </span>

        {/* Clean, Spacious Editorial Headline */}
        <h1
          className="font-serif font-light tracking-wide leading-[1.05] mb-8 drop-shadow-md max-w-3xl transition-colors duration-300"
          style={{
            color: textColor,
            fontSize: "clamp(2.8rem, 7vw, 6.5rem)",
          }}
        >
          {hero.heroTitle}
        </h1>

        {/* Centered Minimal CTA */}
        <div className="pt-2">
          <Link
            href={hero.heroCtaLink}
            className="group inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 backdrop-blur-xs transition-all duration-400 shadow-sm max-w-full text-center hover:scale-[1.02]"
            style={{
              borderColor: `${textColor}B3`, // ~70% opacity
              borderWidth: "1px",
              borderStyle: "solid",
              color: textColor,
            }}
          >
            <span className="text-[10px] sm:text-[11px] tracking-wider sm:tracking-[0.25em] uppercase font-light truncate">
              {hero.heroCtaText}
            </span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Delicate Bottom Indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: textColor }}
      >
        <span className="text-[9px] tracking-[0.3em] uppercase font-light">
          Scroll
        </span>
        <div
          className="w-[1px] h-4"
          style={{ backgroundColor: `${textColor}99` }}
        />
      </div>
    </section>
  );
}
