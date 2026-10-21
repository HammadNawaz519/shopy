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

export default function AdminHeader({ title, subtitle, onOpenMobileMenu }: AdminHeaderProps) {
  const { openMobileMenu } = useAdminNav();
  const [storage, setStorage] = useState<StorageMetrics | null>(cachedStorage);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // DB reset state machine: idle -> armed (first tap) -> running -> done/error
  const [resetStep, setResetStep] = useState<"idle" | "armed" | "running" | "done" | "error">(
    "idle"
  );
  const [resetError, setResetError] = useState<string | null>(null);

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

  const handleResetDb = useCallback(async () => {
    if (resetStep === "armed") {
      // Second confirmation: actually wipe all records (images are preserved
      // server-side — media_assets + storage files are never touched).
      setResetStep("running");
      setResetError(null);
      try {
        const res = await fetch("/api/admin/db/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ confirm: "RESET" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || data.detail || `HTTP ${res.status}`);
        }
        setResetStep("done");
        // The wipe changes the numbers - refresh the pill metrics.
        cachedStorage = null;
        lastFetchTime = 0;
        fetchStorage(true);
      } catch (err) {
        setResetStep("error");
        setResetError(err instanceof Error ? err.message : "Reset failed");
      }
    } else {
      setResetStep("armed");
    }
  }, [resetStep, fetchStorage]);

  useEffect(() => {
    fetchStorage(false);
  }, [fetchStorage]);

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
                  {resetStep === "done" ? (
                    <p className="text-[10px] font-medium text-emerald-700/90">
                      Reset complete — all data records wiped, images preserved.
                    </p>
                  ) : resetStep === "error" ? (
                    <p className="text-[10px] font-medium text-red-700">
                      {resetError || "Reset failed."}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetDb();
                        }}
                        disabled={resetStep === "running"}
                        className={`flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 ${
                          resetStep === "armed"
                            ? "bg-[#8B2C2C] text-[#F4F4F2] hover:bg-[#7A2525]"
                            : "border border-[#8B2C2C]/50 text-[#8B2C2C] hover:bg-[#8B2C2C]/5"
                        }`}
                      >
                        {resetStep === "running"
                          ? "Resetting…"
                          : resetStep === "armed"
                            ? "Confirm — Wipe All Data"
                            : "Reset DB"}
                      </button>
                      {resetStep === "armed" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetStep("idle");
                          }}
                          className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-[#495464]/70 hover:text-[#495464] border border-[#BBBFCA] transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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
