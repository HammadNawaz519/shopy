"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [stage, setStage] = useState<"hidden" | "entering" | "hold" | "exiting" | "done">("hidden");

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Check if splash already played in this browser session
    const hasPlayed = sessionStorage.getItem("shopy_splash_viewed");
    if (hasPlayed) {
      setStage("done");
      return;
    }

    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      sessionStorage.setItem("shopy_splash_viewed", "true");
      setStage("done");
      return;
    }

    // Lock body scroll during initial splash
    document.body.style.overflow = "hidden";

    // Mark as played for the current session
    sessionStorage.setItem("shopy_splash_viewed", "true");

    // Phase 1: Mount and trigger smooth logo fade-in & scale
    setStage("entering");

    // Phase 2: Hold logo in center
    const holdTimer = setTimeout(() => {
      setStage("hold");
    }, 450);

    // Phase 3: Move up smoothly (curtain reveal)
    const exitTimer = setTimeout(() => {
      setStage("exiting");
      // Unlock scroll as curtain begins moving up
      document.body.style.overflow = "";
    }, 1300);

    // Phase 4: Complete and unmount from DOM
    const completeTimer = setTimeout(() => {
      setStage("done");
      document.body.style.overflow = "";
    }, 2000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
      document.body.style.overflow = "";
    };
  }, []);

  // Allow clicking anywhere to skip immediately
  const handleFastSkip = () => {
    if (stage !== "done" && stage !== "exiting") {
      setStage("exiting");
      document.body.style.overflow = "";
      setTimeout(() => {
        setStage("done");
      }, 500);
    }
  };

  if (stage === "hidden" || stage === "done") {
    return null;
  }

  const isExiting = stage === "exiting";
  const isEntering = stage === "entering";

  return (
    <div
      onClick={handleFastSkip}
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white cursor-pointer select-none transition-transform duration-[700ms] will-change-transform ${
        isExiting ? "-translate-y-full pointer-events-none" : "translate-y-0"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      {/* Centered Logo Container */}
      <div
        className={`relative flex flex-col items-center transition-all duration-[600ms] ${
          isEntering
            ? "opacity-0 scale-[0.94] translate-y-3"
            : isExiting
            ? "opacity-0 -translate-y-8 scale-[0.98]"
            : "opacity-100 scale-100 translate-y-0"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Exact logo.svg from public */}
        <div className="relative w-[240px] sm:w-[320px] md:w-[380px] aspect-[640/180] filter drop-shadow-[0_4px_20px_rgba(73,84,100,0.08)]">
          <Image
            src="/logo.svg"
            alt="SHOPY"
            fill
            priority
            unoptimized
            className="object-contain"
          />
        </div>

        {/* Delicate Atelier Subtitle & Hairline */}
        <div
          className={`mt-6 flex flex-col items-center transition-opacity duration-500 delay-150 ${
            isEntering ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.35em] text-[#495464]/60 font-light">
            Haute Atelier
          </span>
          <div className="mt-3 w-8 h-[1px] bg-[#BBBFCA]/40" />
        </div>
      </div>

      {/* Subtle Bottom Skip Hint */}
      <div
        className={`absolute bottom-8 text-[9px] uppercase tracking-[0.25em] text-[#495464]/30 transition-opacity duration-300 ${
          isEntering || isExiting ? "opacity-0" : "opacity-70"
        }`}
      >
        Tap anywhere to enter
      </div>
    </div>
  );
}
