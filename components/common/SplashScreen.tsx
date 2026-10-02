"use client";

import React, { useEffect, useState, useRef } from "react";

export default function SplashScreen() {
  // Start off-screen at bottom so we can slide it IN, then slide UP to exit
  // Simpler: start visible (translateY 0), then slide to translateY(-100%)
  const [show, setShow] = useState(true);
  const [slideUp, setSlideUp] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasRun.current) return;
    hasRun.current = true;

    // Skip if already seen this session or reduced-motion
    const seen = sessionStorage.getItem("shopy_splash_viewed");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      setShow(false);
      return;
    }

    // Lock scroll
    document.body.style.overflow = "hidden";

    // After 850ms hold → trigger slide-up
    const holdTimer = setTimeout(() => {
      document.body.style.overflow = "";
      setSlideUp(true);

      // After slide-up animation (850ms) → remove from DOM
      const doneTimer = setTimeout(() => {
        try { sessionStorage.setItem("shopy_splash_viewed", "true"); } catch {}
        setShow(false);
      }, 900);

      return () => clearTimeout(doneTimer);
    }, 850);

    return () => {
      clearTimeout(holdTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <div
      id="shopy-splash"
      aria-hidden="true"
      onClick={() => {
        if (!slideUp) {
          document.body.style.overflow = "";
          setSlideUp(true);
          setTimeout(() => {
            try { sessionStorage.setItem("shopy_splash_viewed", "true"); } catch {}
            setShow(false);
          }, 900);
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        willChange: "transform",
        // Always keep transition active so browser has it registered before state change
        transition: "transform 850ms cubic-bezier(0.76, 0, 0.24, 1)",
        transform: slideUp ? "translateY(-100%)" : "translateY(0%)",
        pointerEvents: slideUp ? "none" : "auto",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.png"
        alt="SHOPY"
        draggable={false}
        style={{
          width: 120,
          height: 120,
          objectFit: "contain",
          display: "block",
          opacity: slideUp ? 0 : 1,
          transform: slideUp ? "scale(0.92)" : "scale(1)",
          transition: "opacity 400ms ease, transform 400ms ease",
        }}
      />

      {/* Tap hint */}
      <span
        style={{
          position: "absolute",
          bottom: 36,
          fontSize: 9,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(73,84,100,0.35)",
          opacity: slideUp ? 0 : 1,
          transition: "opacity 300ms",
        }}
      >
        Tap anywhere to enter
      </span>
    </div>
  );
}
