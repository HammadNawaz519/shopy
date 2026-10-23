"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Menu, Database, HardDrive, RefreshCw, Layers, Trash2 } from "lucide-react";
import { useAdminNav } from "./AdminLayoutClient";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

interface StorageMetrics {
  dbSizeBytes: number;
  dbSizeFormatted: string;
  mediaSizeBytes: number;
  mediaSizeFormatted: string;
  mediaCount: number;
  productImagesCount: number;
  productsCount: number;
  ordersCount: number;
  totalStorageFormatted: string;
  timestamp: string;
}

// In-memory module-level singleton cache across admin page transitions (Zero redundant requests)
let cachedStorage: StorageMetrics | null = null;
let lastFetchTime = 0;
const CLIENT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes memory cache

interface PendingDestructiveAuth {
  operation: string;
  token: string;
  expiresAt: number;
}

export default function AdminHeader({ title, subtitle, onOpenMobileMenu }: AdminHeaderProps) {
  const { openMobileMenu } = useAdminNav();
  const [storage, setStorage] = useState<StorageMetrics | null>(cachedStorage);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // DB reset state machine, guarded by fresh Google re-authentication:
  //   idle -> verify ("Verify with Google" -> Google round trip, max_age=0)
  //        -> ready (server minted a 10-minute single-use authorization)
  //        -> running (explicit final confirmation POSTed with the token)
  //        -> done / error (error re-arms the verify step; the token is
  //        single-use server-side, so every retry starts a fresh Google check)
  const [resetStep, setResetStep] = useState<
    "idle" | "verify" | "ready" | "running" | "done" | "error"
  >("idle");
  const [resetError, setResetError] = useState<string | null>(null);
  const [pendingAuth, setPendingAuth] = useState<PendingDestructiveAuth | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [reauthNotice, setReauthNotice] = useState<string | null>(null);
  const [reauthNoticeTone, setReauthNoticeTone] = useState<"ok" | "warn">("ok");

  const fetchStorage = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedStorage && now - lastFetchTime < CLIENT_CACHE_TTL) {
      setStorage(cachedStorage);
      return;
    }

    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/admin/storage${force ? "?refresh=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        if (data.storage) {
          cachedStorage = data.storage;
          lastFetchTime = Date.now();
          setStorage(data.storage);
        }
      }
    } catch {
      // Silently maintain existing state
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Refresh the pending Google re-authorization for this admin session.
  const fetchReauthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/db/reset/reauth", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.pending) {
        setPendingAuth(data.pending);
        setResetStep((s) => (s === "idle" || s === "verify" ? "ready" : s));
      } else {
        setPendingAuth(null);
      }
    } catch {
      // Transient error: keep current step, the server stays authoritative.
    }
  }, []);

  // Send the admin to Google for a fresh re-authentication (max_age=0).
  // On return (redirect lands back on /admin) the callback has minted a
  // short-lived single-use token, which fetchReauthStatus surfaces as "ready".
  const startGoogleVerify = useCallback(async () => {
    setVerifying(true);
    setReauthNotice(null);
    try {
      const res = await fetch("/api/admin/db/reset/reauth", { cache: "no-store" });
      if (!res.ok) {
        setReauthNoticeTone("warn");
        setReauthNotice(
          res.status === 503
            ? "Google sign-in is not configured, so reset verification is unavailable."
            : "Could not start Google verification. Please try again."
        );
        setVerifying(false);
        return;
      }
      const data = await res.json();
      if (data.pending) {
        // Already verified and the token is still live — skip the round trip.
        setPendingAuth(data.pending);
        setResetStep("ready");
        setVerifying(false);
        return;
      }
      if (data.authUrl) {
        window.location.assign(data.authUrl);
        return;
      }
      setReauthNoticeTone("warn");
      setReauthNotice("Google verification is unavailable right now. Please try again.");
      setVerifying(false);
    } catch {
      setReauthNoticeTone("warn");
      setReauthNotice("Network error — could not start Google verification.");
      setVerifying(false);
    }
  }, []);

  // Explicit FINAL confirmation: POSTs the single-use token to the server.
  // The destructive endpoint verifies + consumes it before touching data.
  const handleResetDb = useCallback(async () => {
    if (resetStep !== "ready" || !pendingAuth) return;
    setResetStep("running");
    setResetError(null);
    try {
      const res = await fetch("/api/admin/db/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: "RESET", authToken: pendingAuth.token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.detail || `HTTP ${res.status}`);
      }
      setPendingAuth(null);
      setResetStep("done");
      // The wipe changes the numbers - refresh the pill metrics.
      cachedStorage = null;
      lastFetchTime = 0;
      fetchStorage(true);
    } catch (err) {
      setPendingAuth(null);
      setResetStep("error");
      setResetError(err instanceof Error ? err.message : "Reset failed");
    }
  }, [resetStep, pendingAuth, fetchStorage]);

  useEffect(() => {
    fetchStorage(false);
    fetchReauthStatus();

    // Arriving back from the Google round trip: surface the result marker
    // (?reauth=success|failed) once, then strip it from the URL.
    const marker = new URLSearchParams(window.location.search).get("reauth");
    if (marker === "success") {
      setReauthNoticeTone("ok");
      setReauthNotice("Google verified — you can confirm the database reset below.");
    } else if (marker === "failed") {
      setReauthNoticeTone("warn");
      setReauthNotice(
        "Google verification did not complete (cancelled, account mismatch, or expired). No data was changed — start again when ready."
      );
    }
    if (marker) {
      const next = new URL(window.location.href);
      next.searchParams.delete("reauth");
      window.history.replaceState({}, "", next.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = onOpenMobileMenu || openMobileMenu;

  return (
    <header
      className="h-[calc(4rem+env(safe-area-inset-top,0px))] bg-[#F4F4F2] border-b border-[#BBBFCA]/40 px-4 sm:px-6 pt-[env(safe-area-inset-top,0px)] flex items-center justify-between sticky top-0 z-20 select-none"
    >
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={handleToggle}
          className="lg:hidden p-1.5 text-[#495464] hover:bg-[#E8E8E8] transition-colors rounded-xs"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="font-serif text-lg sm:text-xl font-medium text-[#495464] tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] uppercase tracking-widest text-[#495464]/60 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Side: Real PostgreSQL & Supabase Storage Indicator */}
      <div className="relative flex items-center gap-3">
        {storage && (
          <div
            className="relative"
            onMouseEnter={() => setShowDetails(true)}
            onMouseLeave={() => setShowDetails(false)}
          >
            {/* Elegant Compact Storage Pill — click toggles the details
                 (touch-friendly); hover already shows it on desktop */}
            <div
              className="flex items-center gap-2 bg-[#E8E8E8]/90 hover:bg-[#E8E8E8] border border-[#BBBFCA]/60 px-2.5 py-1.5 text-[#495464] transition-colors cursor-pointer rounded-xs shadow-2xs"
              onClick={() => setShowDetails((v) => !v)}
            >
              <Database className="w-3.5 h-3.5 text-[#495464]/80 flex-shrink-0" />
              <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-tight font-medium">
                <span className="text-[#495464]/80">DB:</span>
                <span className="font-semibold text-[#495464]">{storage.dbSizeFormatted}</span>
                <span className="text-[#BBBFCA] hidden sm:inline">•</span>
                <span className="text-[#495464]/80 hidden sm:inline">Media:</span>
                <span className="font-semibold text-[#495464] hidden sm:inline">
                  {storage.mediaSizeFormatted}
                </span>
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchStorage(true);
                }}
                disabled={isRefreshing}
                title="Refresh Storage Metrics"
                className="ml-1 p-0.5 text-[#495464]/60 hover:text-[#495464] transition-colors"
                aria-label="Refresh storage metrics"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRefreshing ? "animate-spin text-[#495464]" : ""}`}
                />
              </button>
            </div>

            {/* Tap/click-away dismiss layer (mobile: the popover is toggled by
                 tap, so anything outside it closes it) */}
            {showDetails && (
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setShowDetails(false)}
              />
            )}

            {/* Hover + Click Breakdown Popover */}
            {showDetails && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#F4F4F2] border border-[#BBBFCA] shadow-xl p-3.5 z-50 text-[#495464] text-xs animate-fadeIn space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#BBBFCA]/40 pb-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/80">
                    System Storage Metrics
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#495464]/70 flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-[#495464]/60" />
                      PostgreSQL Database:
                    </span>
                    <span className="font-mono font-semibold text-[#495464]">
                      {storage.dbSizeFormatted}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#495464]/70 flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3 text-[#495464]/60" />
                      Media Assets Bucket:
                    </span>
                    <span className="font-mono font-semibold text-[#495464]">
                      {storage.mediaSizeFormatted} ({storage.mediaCount} files)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#495464]/70 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#495464]/60" />
                      Gallery Image Links:
                    </span>
                    <span className="font-mono font-semibold text-[#495464]">
                      {storage.productImagesCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#BBBFCA]/40 flex justify-between items-center font-medium">
                  <span className="text-[10px] uppercase tracking-wider text-[#495464]/80">
                    Total App Storage:
                  </span>
                  <span className="font-mono font-bold text-sm text-[#495464]">
                    {storage.totalStorageFormatted}
                  </span>
                </div>

                {/* DB Reset — two-step confirm; wipes all data records but
                    never touches image/media assets (server-side). */}
                <div className="pt-2 border-t border-[#BBBFCA]/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#495464]/80">
                    <Trash2 className="w-3 h-3 text-[#495464]/60" />
                    Reset Database
                  </div>
                  <p className="text-[10px] leading-relaxed text-[#495464]/55">
                    Deletes all records (products, orders, reviews, users…) and
                    restores default settings. Images / media are kept.
                  </p>
                  {reauthNotice && (
                    <p
                      className={`text-[10px] leading-relaxed font-medium ${
                        reauthNoticeTone === "ok" ? "text-emerald-700/90" : "text-[#8B2C2C]"
                      }`}
                    >
                      {reauthNotice}
                    </p>
                  )}
                  {resetStep === "done" ? (
                    <p className="text-[10px] font-medium text-emerald-700/90">
                      Reset complete — all data records wiped, images preserved.
                    </p>
                  ) : resetStep === "error" ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-red-700">
                        {resetError || "Reset failed."}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResetStep("verify");
                          setResetError(null);
                        }}
                        className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-[#8B2C2C] border border-[#8B2C2C]/50 hover:bg-[#8B2C2C]/5 transition-colors"
                      >
                        Verify with Google
                      </button>
                    </div>
                  ) : resetStep === "running" ? (
                    <p className="text-[10px] font-medium text-[#495464]/70">
                      Resetting — in progress…
                    </p>
                  ) : resetStep === "ready" && pendingAuth ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-emerald-700/90">
                        Google verified — final confirmation
                      </p>
                      <p className="text-[10px] leading-relaxed text-[#495464]/55">
                        Permanently deletes all data records. Valid for the next
                        ~10 minutes.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetDb();
                          }}
                          className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold bg-[#8B2C2C] text-[#F4F4F2] hover:bg-[#7A2525] transition-colors"
                        >
                          Confirm — Wipe All Data
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetStep("idle");
                            setPendingAuth(null);
                          }}
                          className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] border border-[#BBBFCA] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : resetStep === "verify" ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] leading-relaxed text-[#495464]/55">
                        Google re-authentication is required before wiping.
                        After verifying, you get a 10-minute confirmation
                        window here.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startGoogleVerify();
                          }}
                          disabled={verifying}
                          className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold bg-[#495464] text-[#F4F4F2] hover:bg-[#363E4B] transition-colors disabled:opacity-60"
                        >
                          {verifying ? "Opening Google…" : "Verify with Google"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetStep("idle");
                            setReauthNotice(null);
                          }}
                          className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] border border-[#BBBFCA] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReauthNotice(null);
                        setResetStep("verify");
                      }}
                      className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold border border-[#8B2C2C]/50 text-[#8B2C2C] hover:bg-[#8B2C2C]/5 transition-colors"
                    >
                      Reset DB
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
