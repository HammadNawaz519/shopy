"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Capacitor } from "@capacitor/core";
import { Download, X, Smartphone } from "lucide-react";

/**
 * Top-right APK download popup.
 *
 * Replaces the old PWA (add-to-home-screen) install flow: the button at the
 * bottom of the page and this popup now both point at the real Android APK
 * download (GitHub Releases asset) instead of a PWA install prompt.
 */
export default function InstallAppPrompt() {
  const [show, setShow] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Inside the Capacitor app there is nothing to install — no popup.
    if (Capacitor.isNativePlatform()) {
      setIsNative(true);
      return;
    }

    // Reopen on demand (kept for any caller dispatching the legacy event).
    const open = () => setShow(true);
    window.addEventListener("shopy:open-install-prompt", open);

    // Dismissal is remembered: mobile re-offers after 24h (the download
    // prompt matters most there), desktop after 7 days.
    const dismissedAt = localStorage.getItem("shopy_apk_prompt_dismissed");
    const isMobile =
      window.matchMedia("(max-width: 767px)").matches ||
      (typeof window.navigator.maxTouchPoints === "number" &&
        window.navigator.maxTouchPoints > 1);
    const reOfferMs = isMobile ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > reOfferMs) {
      timerRef.current = setTimeout(() => setShow(true), 3000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("shopy:open-install-prompt", open);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    try {
      localStorage.setItem("shopy_apk_prompt_dismissed", Date.now().toString());
    } catch {}
  };

  if (isNative || !show) return null;

  return (
    <div className="fixed top-4 right-4 z-[90] animate-slide-up">
      <div className="bg-[#F4F4F2] text-[#495464] border border-[#BBBFCA]/60 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.12)] relative max-w-[300px] sm:max-w-[340px]">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-[#495464]/60 hover:text-[#495464] p-1 transition-colors"
          aria-label="Close download prompt"
        >
          <X className="w-4 h-4 stroke-[1.5]" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="relative w-12 h-12 flex-shrink-0 bg-white border border-[#BBBFCA]/40 p-1">
            <Image src="/icon-192x192.png" alt="SHOPY App" fill className="object-cover" />
          </div>

          <div className="flex-1 pr-5">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#495464]/60 font-semibold block mb-0.5">
              Get the SHOPY App
            </span>
            <p className="text-[11px] text-[#495464]/70 mt-1 leading-relaxed">
              Download the Android APK and install it directly — full-screen,
              no browser bar.
            </p>

            <div className="mt-3.5 flex items-center gap-2.5">
              {/* Direct asset download: same-page navigation (no GitHub tab).
                  GitHub serves the asset with Content-Disposition: attachment,
                  so the browser starts the download without rendering any
                  GitHub page. The download attribute is a same-origin hint
                  only - the attachment header is what forces the download. */}
              <a
                href="https://github.com/HammadNawaz519/shopy/releases/download/Shopy/shopy.apk"
                download="shopy.apk"
                className="inline-flex items-center gap-2 bg-[#495464] hover:bg-[#363E4B] text-white text-[10px] uppercase tracking-[0.2em] px-4 py-2 font-light transition-all"
              >
                <Download className="w-3 h-3" />
                <span>Download APK</span>
              </a>

              <button
                onClick={handleDismiss}
                className="text-[10px] uppercase tracking-[0.18em] text-[#495464]/60 hover:text-[#495464] px-2.5 py-2 transition-colors"
              >
                Not Now
              </button>
            </div>

            <p className="mt-2 text-[9px] tracking-widest uppercase text-[#495464]/40 flex items-center gap-1.5">
              <Smartphone className="w-3 h-3" /> Android • SHOPY Atelier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
