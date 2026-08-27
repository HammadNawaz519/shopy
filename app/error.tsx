"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error internally without exposing details to user interface
    console.error("SHOPY Application Error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[100] min-h-screen w-full bg-[#F4F4F2] text-[#495464] overflow-y-auto flex items-center justify-center px-5 sm:px-6 py-12 select-none">
      <div className="max-w-xl w-full mx-auto text-center relative z-10 flex flex-col items-center my-auto">
        
        {/* Architectural 500 Circle Frame (Optically & Mathematically Centered) */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center mb-6">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-[#495464]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="500 Atelier Interrupted"
          >
            {/* Fine Hairline Dashed Frame */}
            <circle
              cx="100"
              cy="100"
              r="94"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="opacity-20"
            />
            
            {/* Inner Architectural Axis Lines */}
            <line
              x1="100"
              y1="8"
              x2="100"
              y2="192"
              stroke="currentColor"
              strokeWidth="0.75"
              className="opacity-15"
            />
            <line
              x1="8"
              y1="100"
              x2="192"
              y2="100"
              stroke="currentColor"
              strokeWidth="0.75"
              className="opacity-15"
            />
            <circle
              cx="100"
              cy="100"
              r="62"
              stroke="currentColor"
              strokeWidth="0.75"
              className="opacity-15"
            />

            {/* Optically Centered Editorial 500 Text */}
            <text
              x="100"
              y="88"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#495464"
              fontFamily="var(--font-cormorant), 'Cormorant Garamond', Georgia, serif"
              fontSize="74"
              fontWeight="300"
              letterSpacing="-2"
              className="font-serif font-light select-none"
            >
              500
            </text>
          </svg>
        </div>

        {/* Minimalist Eyebrow Label Placed Under the Entire 500 Circle */}
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#495464] flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#495464]/80 font-semibold font-mono">
            500 • ATELIER INTERRUPTED
          </span>
        </div>

        {/* Hairline Divider */}
        <div className="w-12 h-px bg-[#BBBFCA]/70 my-2" aria-hidden="true" />

        {/* Polished Editorial Supporting Text */}
        <p className="text-xs sm:text-[13px] text-[#495464]/75 tracking-editorial uppercase max-w-md mx-auto leading-relaxed mt-2 mb-8">
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
          <Link
            href="/"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 border border-[#495464]/40 bg-transparent text-[#495464] px-7 sm:px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs uppercase tracking-[0.22em] font-medium hover:border-[#495464] hover:bg-[#495464]/5 transition-all duration-300 text-center focus:outline-none focus:ring-1 focus:ring-[#495464]"
          >
            <span>Back to Home</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

      </div>
    </div>
  );
}
