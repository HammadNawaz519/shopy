"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("SHOPY Global Fatal Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Something went wrong | SHOPY</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#F4F4F2",
          color: "#495464",
          fontFamily:
            "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
        className="bg-[#F4F4F2] text-[#495464] antialiased"
      >
        <div className="min-h-screen py-16 sm:py-24 flex items-center justify-center bg-[#F4F4F2] text-[#495464] px-5 sm:px-6 relative overflow-hidden select-none">
          <div className="max-w-xl w-full mx-auto text-center relative z-10 flex flex-col items-center">
            
            {/* Subtle Architectural Hairline Brand Watermark Frame (Aria Hidden) */}
            <div
              className="relative flex items-center justify-center mb-2"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 200 200"
                className="w-48 h-48 sm:w-56 sm:h-56 text-[#495464]/10 absolute -top-4 sm:-top-6 pointer-events-none transition-transform duration-700 ease-out"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="94"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <line x1="100" y1="12" x2="100" y2="188" stroke="currentColor" strokeWidth="0.75" />
                <line x1="12" y1="100" x2="188" y2="100" stroke="currentColor" strokeWidth="0.75" />
                <circle cx="100" cy="100" r="45" stroke="currentColor" strokeWidth="1" />
              </svg>

              {/* Prominent Editorial 500 Number */}
              <span
                style={{
                  fontFamily:
                    "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                }}
                className="font-serif font-light text-7xl sm:text-8xl md:text-9xl text-[#495464] tracking-tight leading-none relative z-10 block select-none"
              >
                500
              </span>
            </div>

            {/* Minimalist Sub-header / Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#495464] flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#495464]/75 font-semibold font-mono">
                500 • ATELIER INTERRUPTED
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily:
                  "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              }}
              className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-[#495464] tracking-tight leading-snug max-w-lg mt-1 mb-3"
            >
              Something went off track.
            </h1>

            {/* Hairline Divider */}
            <div className="w-12 h-px bg-[#BBBFCA]/70 my-2" aria-hidden="true" />

            {/* Polished Editorial Supporting Text */}
            <p className="text-xs sm:text-[13px] text-[#495464]/75 tracking-[0.15em] uppercase max-w-md mx-auto leading-relaxed mt-2 mb-8">
              We couldn&apos;t load this page right now. Please try again or return to SHOPY.
            </p>

            {/* Action Buttons (Primary: Try Again, Secondary: Back to Home) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-xs sm:max-w-none">
              {/* Primary CTA (Reset Next.js state) */}
              <button
                type="button"
                onClick={() => reset()}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#495464] text-[#F4F4F2] px-7 sm:px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium hover:bg-[#363E4B] transition-all duration-300 shadow-sm text-center focus:outline-none focus:ring-1 focus:ring-[#495464]"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform duration-300" />
                <span>Try Again</span>
              </button>

              {/* Secondary CTA */}
              <a
                href="/"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 border border-[#495464]/40 bg-transparent text-[#495464] px-7 sm:px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium hover:border-[#495464] hover:bg-[#495464]/5 transition-all duration-300 text-center focus:outline-none focus:ring-1 focus:ring-[#495464]"
              >
                <span>Back to Home</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>

          </div>
        </div>
      </body>
    </html>
  );
}
