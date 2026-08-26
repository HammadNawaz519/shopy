"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { AlertCircle, AlertTriangle, Loader2, X } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  entityName?: string;
  entityImage?: string | null;
  secondaryNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  entityName,
  entityImage,
  secondaryNote,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDanger = true,
  isLoading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus management & Escape key handling
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      // Focus the cancel button first for safe default keyboard navigation
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isLoading) {
          e.preventDefault();
          onCancel();
        }

        // Trap focus inside modal
        if (e.key === "Tab" && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            const firstEl = focusableElements[0];
            const lastEl = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
        previouslyFocusedRef.current?.focus();
      };
    }
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      {/* Soft translucent dark backdrop */}
      <div
        className="fixed inset-0 bg-[#363E4B]/70 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[#F4F4F2] text-[#495464] border border-[#BBBFCA]/60 shadow-2xl p-6 sm:p-8 z-10 transition-all duration-200 animate-scaleUp focus:outline-none"
        tabIndex={-1}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (!isLoading) onCancel();
          }}
          disabled={isLoading}
          className="absolute right-4 top-4 p-1.5 text-[#495464]/60 hover:text-[#495464] hover:bg-[#E8E8E8] transition-colors rounded-xs disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Luxury Brand Accent */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#E8E8E8] border border-[#BBBFCA]/60 flex items-center justify-center shrink-0 mt-0.5 text-[#363E4B]">
            {isDanger ? (
              <AlertTriangle className="w-4 h-4 text-[#363E4B]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#363E4B]" />
            )}
          </div>
          <div className="pr-6">
            <h3
              id="confirm-modal-title"
              className="font-serif text-lg sm:text-xl font-medium text-[#495464] tracking-tight leading-snug"
            >
              {title}
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-[#495464]/60 mt-0.5">
              SHOPY Atelier Action Confirmation
            </p>
          </div>
        </div>

        {/* Primary Description */}
        <p id="confirm-modal-desc" className="text-xs sm:text-sm text-[#495464]/85 leading-relaxed mb-4">
          {description}
        </p>

        {/* Entity Card Preview (if provided) */}
        {entityName && (
          <div className="flex items-center gap-3.5 p-3 bg-[#E8E8E8] border border-[#BBBFCA]/40 mb-4 rounded-xs">
            {entityImage ? (
              <div className="relative w-12 h-14 shrink-0 bg-[#F4F4F2] border border-[#BBBFCA]/40 overflow-hidden">
                <Image
                  src={entityImage}
                  alt={entityName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 shrink-0 bg-[#F4F4F2] border border-[#BBBFCA]/40 flex items-center justify-center text-[#495464]/40 font-serif text-xs">
                S
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase tracking-widest text-[#495464]/60 font-medium block">
                Target Entity
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#495464] truncate block">
                {entityName}
              </span>
            </div>
          </div>
        )}

        {/* Secondary Context / Safety Note */}
        {secondaryNote && (
          <div className="p-3 bg-[#F4F4F2] border-l-2 border-[#BBBFCA] text-[11px] text-[#495464]/75 leading-normal mb-5">
            {secondaryNote}
          </div>
        )}

        {/* Inline Human-Readable Error Display (never raw JSON / SQL) */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50/80 border border-red-200 text-red-900 text-xs rounded-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-red-950 mb-0.5">Unable to complete request</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-[#BBBFCA]/40">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 px-5 bg-transparent hover:bg-[#E8E8E8] text-[#495464] text-xs uppercase tracking-wider font-semibold border border-[#BBBFCA] transition-colors focus:outline-none focus:ring-1 focus:ring-[#495464] disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto h-10 px-6 text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#495464] disabled:opacity-60 ${
              isDanger
                ? "bg-[#363E4B] hover:bg-[#495464] text-[#F4F4F2]"
                : "bg-[#495464] hover:bg-[#363E4B] text-[#F4F4F2]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4F4F2]" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{error ? "Try Again" : confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
