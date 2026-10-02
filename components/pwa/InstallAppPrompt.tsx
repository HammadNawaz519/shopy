"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Share2, PlusSquare } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallAppPrompt() {
  const { showToast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if app is already running in standalone mode (installed)
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isInStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS devices (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      userAgent.includes("safari") &&
      !userAgent.includes("crios") &&
      !userAgent.includes("fxios") &&
      !userAgent.includes("chrome");

    if (isAppleDevice) {
      setIsIOS(true);
    }

    // Listen for the Chrome/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser's default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user dismissed recently (wait 7 days)
      const dismissedAt = localStorage.getItem("shopy_pwa_dismissed");
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > sevenDays) {
        // Show after a gentle 3-second delay so user can see the hero first
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for manual trigger from menu or footer
    const handleManualTrigger = () => {
      if (deferredPrompt) {
        setShowBanner(true);
        handleInstallClick();
      } else if (isAppleDevice) {
        setShowIOSModal(true);
      } else {
        // Browser doesn't support automatic prompt, show guidance
        setShowBanner(true);
      }
    };

    window.addEventListener("shopy:open-install-prompt", handleManualTrigger);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      showToast("SHOPY Atelier App installed successfully", "success");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("shopy:open-install-prompt", handleManualTrigger);
    };
  }, [deferredPrompt, showToast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          showToast("SHOPY Atelier App installed successfully", "success");
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("[PWA] Install prompt failed:", err);
      }
    } else if (isIOS) {
      setShowBanner(false);
      setShowIOSModal(true);
    } else {
      // Fallback for browsers without beforeinstallprompt
      alert("To install, click your browser menu (⋮) and select 'Install SHOPY' or 'Add to Home screen'.");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSModal(false);
    try {
      localStorage.setItem("shopy_pwa_dismissed", Date.now().toString());
    } catch {}
  };

  // If already running standalone or nothing to show, return null
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Sleek Floating Install Banner (Bottom Right / Mobile Bottom) */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[90] animate-slide-up">
          <div className="bg-[#F4F4F2] text-[#495464] border border-[#BBBFCA]/60 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.12)] rounded-none relative">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-[#495464]/60 hover:text-[#495464] p-1 transition-colors"
              aria-label="Close install prompt"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>

            <div className="flex items-start gap-3.5 sm:gap-4">
              {/* App Icon preview */}
              <div className="relative w-12 h-12 flex-shrink-0 bg-white border border-[#BBBFCA]/40 p-1 shadow-xs">
                <Image
                  src="/icon-192x192.png"
                  alt="SHOPY App"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Text info */}
              <div className="flex-1 pr-4">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#495464]/70 font-semibold block mb-0.5">
                  App Experience
                </span>
                <h4 className="font-serif text-base font-medium tracking-wide text-[#495464]">
                  Install SHOPY Atelier
                </h4>
                <p className="text-[11px] text-[#495464]/80 mt-1 leading-relaxed">
                  Fast access, full-screen shopping, and seamless order tracking from your home screen.
                </p>

                {/* Actions */}
                <div className="mt-3.5 flex items-center gap-2.5">
                  <button
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-2 bg-[#495464] hover:bg-[#363E4B] text-white text-[10px] uppercase tracking-[0.2em] px-4 py-2 font-light transition-all shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Install App</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="text-[10px] uppercase tracking-[0.18em] text-[#495464]/70 hover:text-[#495464] px-2.5 py-2 transition-colors"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Editorial iOS Safari Guided Drawer */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full sm:max-w-md bg-[#F4F4F2] text-[#495464] border border-[#BBBFCA]/40 p-6 sm:p-8 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-[#495464]/60 hover:text-[#495464] p-1.5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-[#BBBFCA]/30">
              <div className="relative w-10 h-10 border border-[#BBBFCA]/40 p-0.5 bg-white">
                <Image src="/icon-192x192.png" alt="SHOPY" fill className="object-cover" />
              </div>
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#495464]/70 block">
                  iOS Installation
                </span>
                <h3 className="font-serif text-lg font-light tracking-wide">
                  Install SHOPY on iPhone
                </h3>
              </div>
            </div>

            <div className="py-5 space-y-4 text-xs text-[#495464]/90">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold">
                  1
                </div>
                <div className="pt-0.5">
                  <p className="leading-relaxed">
                    Tap the <strong className="font-medium">Share</strong> button in Safari&apos;s bottom navigation toolbar.
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#BBBFCA]/30 text-[11px]">
                    <Share2 className="w-3.5 h-3.5 text-[#495464]" />
                    <span>Share Icon</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold">
                  2
                </div>
                <div className="pt-0.5">
                  <p className="leading-relaxed">
                    Scroll down and tap <strong className="font-medium">&quot;Add to Home Screen&quot;</strong>.
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#BBBFCA]/30 text-[11px]">
                    <PlusSquare className="w-3.5 h-3.5 text-[#495464]" />
                    <span>Add to Home Screen</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold">
                  3
                </div>
                <div className="pt-0.5">
                  <p className="leading-relaxed">
                    Tap <strong className="font-medium">Add</strong> in the top right corner. SHOPY will appear on your home screen like a native app.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#BBBFCA]/30">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-3 bg-[#495464] hover:bg-[#363E4B] text-white text-[11px] uppercase tracking-[0.2em] font-light transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
