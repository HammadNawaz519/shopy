"use client";

import React, { useEffect, useState, useRef } from "react";

export default function SplashScreen() {
  const [stage, setStage] = useState<"visible" | "exiting" | "done">("visible");
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // 1. If already viewed in this session or reduced-motion requested, skip immediately
    const alreadyViewed = sessionStorage.getItem("shopy_splash_viewed");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSkippedInHtml = document.documentElement.classList.contains("shopy-splash-skip");

    if (alreadyViewed || prefersReducedMotion || isSkippedInHtml) {
      setStage("done");
      document.body.style.overflow = "";
      return;
    }

    // 2. Lock scroll while splash is active
    document.body.style.overflow = "hidden";

    // 3. Graceful hold in center (750ms), then trigger smooth upward curtain reveal
    const holdTimer = setTimeout(() => {
      setStage("exiting");
      // Unlock body scroll as curtain starts moving up
      document.body.style.overflow = "";
    }, 750);

    // 4. Mark finished, unmount completely from DOM
    const finishTimer = setTimeout(() => {
      try {
        sessionStorage.setItem("shopy_splash_viewed", "true");
        document.documentElement.classList.add("shopy-splash-skip");
      } catch {}
      setStage("done");
      document.body.style.overflow = "";
    }, 1600);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(finishTimer);
      document.body.style.overflow = "";
    };
  }, []);

  const handleFastSkip = () => {
    if (stage === "visible") {
      setStage("exiting");
      document.body.style.overflow = "";
      setTimeout(() => {
        try {
          sessionStorage.setItem("shopy_splash_viewed", "true");
          document.documentElement.classList.add("shopy-splash-skip");
        } catch {}
        setStage("done");
      }, 500);
    }
  };

  if (stage === "done") {
    return null;
  }

  const isExiting = stage === "exiting";

  return (
    <div
      id="shopy-splash-overlay"
      onClick={handleFastSkip}
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white cursor-pointer select-none transition-transform duration-[800ms] will-change-transform ${
        isExiting ? "-translate-y-full pointer-events-none" : "translate-y-0"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      {/* Centered Logo Container */}
      <div
        className={`relative flex flex-col items-center mt-16 md:mt-0 transition-all duration-[600ms] ${
          isExiting ? "opacity-0 -translate-y-12 scale-[0.98]" : "opacity-100 scale-100"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* App Icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-512x512.png"
          alt="SHOPY"
          width={120}
          height={120}
          className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] object-contain drop-shadow-[0_4px_24px_rgba(73,84,100,0.15)]"
          draggable={false}
        />

        {/* Delicate Atelier Subtitle & Hairline */}
        <div className="mt-6 flex flex-col items-center">
          <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.35em] text-[#495464]/60 font-light">
            Haute Atelier
          </span>
          <div className="mt-3 w-8 h-[1px] bg-[#BBBFCA]/40" />
        </div>
      </div>

      {/* Subtle Bottom Skip Hint */}
      <div
        className={`absolute bottom-8 text-[9px] uppercase tracking-[0.25em] text-[#495464]/30 transition-opacity duration-300 ${
          isExiting ? "opacity-0" : "opacity-70"
        }`}
      >
        Tap anywhere to enter
      </div>
    </div>
  );
}
