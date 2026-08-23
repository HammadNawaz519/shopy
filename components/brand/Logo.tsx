import React from "react";
import Link from "next/link";

interface LogoProps {
  variant?: "primary" | "reversed" | "symbol" | "monogram";
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  withLink?: boolean;
}

export default function Logo({
  variant = "primary",
  size = "md",
  className = "",
  withLink = true,
}: LogoProps) {
  // Size mapping for typographic scale
  const sizeClasses = {
    sm: "text-lg tracking-[0.3em]",
    md: "text-xl lg:text-2xl tracking-[0.35em]",
    lg: "text-3xl lg:text-4xl tracking-[0.35em]",
    xl: "text-5xl lg:text-6xl tracking-[0.32em]",
    hero: "text-7xl lg:text-9xl tracking-[0.3em]",
  };

  // Color theme mapping
  const colorClasses = {
    primary: "text-[#495464]",
    reversed: "text-[#F4F4F2]",
    symbol: "text-[#495464]",
    monogram: "text-[#495464]",
  };

  // Monogram / Icon Symbol (Interlocking S + H architectural mark)
  if (variant === "monogram" || variant === "symbol") {
    const symbolSvg = (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ${
          size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-16 h-16"
        } ${className}`}
        aria-label="SHOPY Monogram"
      >
        {/* Architectural S Curve */}
        <path
          d="M68 28C64 20 54 16 44 16C30 16 20 25 20 38C20 51 32 56 46 60C62 64 74 69 74 82C74 95 62 104 46 104C32 104 22 96 16 86"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Refined H Vertical Pillar & Crossbar */}
        <line x1="50" y1="8" x2="50" y2="112" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <line x1="82" y1="28" x2="82" y2="92" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="60" x2="82" y2="60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );

    if (withLink) {
      return (
        <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity">
          {symbolSvg}
        </Link>
      );
    }
    return symbolSvg;
  }

  // Primary & Reversed Typographic Editorial Wordmark
  const content = (
    <span
      className={`font-serif font-light select-none inline-block ${sizeClasses[size]} ${colorClasses[variant]} ${className}`}
    >
      SHOPY
    </span>
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-flex items-center hover:opacity-85 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
