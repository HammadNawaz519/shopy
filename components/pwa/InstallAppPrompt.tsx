"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Download, X, Share2, PlusSquare } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallAppPrompt() {
  const { showToast } = useToast();

  // Use refs for things that shouldn't trigger re-renders
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const hasShownBannerRef = useRef(false);
  const isInstallingRef = useRef(false);

  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Stable install handler using ref - no stale closure issues
  const handleInstallClick = useCallback(async () => {
    // Guard against double-click
    if (isInstallingRef.current) return;

    const prompt = deferredPromptRef.current;
    if (prompt) {
      isInstallingRef.current = true;
      setShowBanner(false);
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") {
          // Do NOT show a toast here - the 'appinstalled' event will handle it
          // to avoid duplicate notifications
        }
      } catch (err) {
        console.warn("[PWA] Install prompt failed:", err);
      } finally {
        deferredPromptRef.current = null;
        isInstallingRef.current = false;
      }
    } else if (isIOS) {
      setShowBanner(false);
      setShowIOSModal(true);
    }
  }, [isIOS]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Already installed as standalone app - hide everything
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isInStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    if (isApple) {
      setIsIOS(true);
    }

    const dismissedAt = localStorage.getItem("shopy_pwa_dismissed");
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    let bannerTimer: ReturnType<typeof setTimeout> | undefined;
    if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > sevenDays) {
      hasShownBannerRef.current = true;
      bannerTimer = setTimeout(() => setShowBanner(true), 4000);
    }

    // 3. Single beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;

      // Only auto-show once per session if not recently dismissed
      if (hasShownBannerRef.current) return;

      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > sevenDays) {
        hasShownBannerRef.current = true;
        // Delay banner to not interrupt hero experience
        bannerTimer = setTimeout(() => setShowBanner(true), 4000);
      }
    };

    // 4. Single appinstalled handler - fires ONCE when actually installed
    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setShowBanner(false);
      setShowIOSModal(false);
      // Single success toast - fires exactly once
      showToast("SHOPY Atelier added to your home screen", "success");
    };

    // 5. Manual trigger from Menu / Footer Install App button
    const handleManualTrigger = () => {
      if (deferredPromptRef.current) {
        handleInstallClick();
      } else if (isApple) {
        setShowIOSModal(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("shopy:open-install-prompt", handleManualTrigger);

    return () => {
      if (bannerTimer) clearTimeout(bannerTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("shopy:open-install-prompt", handleManualTrigger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // ← Empty deps: register once, never re-register

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSModal(false);
    try {
      localStorage.setItem("shopy_pwa_dismissed", Date.now().toString());
    } catch {}
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Install Banner — Android / Desktop Chrome */}
      {showBanner && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[90] animate-slide-up">
          <div className="bg-[#F4F4F2] text-[#495464] border border-[#BBBFCA]/60 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.12)] relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-[#495464]/60 hover:text-[#495464] p-1 transition-colors"
              aria-label="Close install prompt"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="relative w-12 h-12 flex-shrink-0 bg-white border border-[#BBBFCA]/40 p-1">
                <Image src="/icon-192x192.png" alt="SHOPY App" fill className="object-cover" />
              </div>

              <div className="flex-1 pr-6">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#495464]/60 font-semibold block mb-0.5">
                  App Experience
                </span>
                <h4 className="font-serif text-base font-medium tracking-wide text-[#495464]">
                  Install SHOPY Atelier
                </h4>
                <p className="text-[11px] text-[#495464]/70 mt-1 leading-relaxed">
                  Instant access, full-screen browsing, no browser bar.
                </p>

                <div className="mt-3.5 flex items-center gap-2.5">
                  <a
                    href="/Shopy.apk"
                    download="Shopy.apk"
                    className="inline-flex items-center gap-2 bg-[#495464] hover:bg-[#363E4B] text-white text-[10px] uppercase tracking-[0.2em] px-4 py-2 font-light transition-all"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download SHOPY</span>
                  </a>

                  <button
                    onClick={handleDismiss}
                    className="text-[10px] uppercase tracking-[0.18em] text-[#495464]/60 hover:text-[#495464] px-2.5 py-2 transition-colors"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Step-by-Step Guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md bg-[#F4F4F2] text-[#495464] border border-[#BBBFCA]/40 p-6 sm:p-8 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-[#495464]/60 hover:text-[#495464] p-1.5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-[#BBBFCA]/30">
              <div className="relative w-10 h-10 border border-[#BBBFCA]/40 p-0.5 bg-white flex-shrink-0">
                <Image src="/icon-192x192.png" alt="SHOPY" fill className="object-cover" />
              </div>
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#495464]/60 block">
                  iOS Installation
                </span>
                <h3 className="font-serif text-lg font-light tracking-wide">
                  Install SHOPY on iPhone
                </h3>
              </div>
            </div>

            <div className="py-5 space-y-4 text-xs text-[#495464]/80">
              {[
                {
                  n: 1,
                  icon: <Share2 className="w-3.5 h-3.5" />,
                  label: "Share Icon",
                  text: <>Tap the <strong className="font-medium text-[#495464]">Share</strong> button at the bottom of Safari.</>,
                },
                {
                  n: 2,
                  icon: <PlusSquare className="w-3.5 h-3.5" />,
                  label: "Add to Home Screen",
                  text: <>Scroll and tap <strong className="font-medium text-[#495464]">&quot;Add to Home Screen&quot;</strong>.</>,
                },
                {
                  n: 3,
                  icon: null,
                  label: null,
                  text: <>Tap <strong className="font-medium text-[#495464]">Add</strong> — SHOPY appears on your home screen like a native app.</>,
                },
              ].map(({ n, icon, label, text }) => (
                <div key={n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-[#495464]">
                    {n}
                  </div>
                  <div className="pt-0.5">
                    <p className="leading-relaxed">{text}</p>
                    {icon && label && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#BBBFCA]/30 text-[11px] text-[#495464]">
                        {icon}
                        <span>{label}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#BBBFCA]/30">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-3 bg-[#495464] hover:bg-[#363E4B] text-white text-[11px] uppercase tracking-[0.2em] font-light transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
