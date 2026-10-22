"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  leaving?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const EXIT_MS = 250; // matches toastOut animation duration

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Mark the toast as leaving so it can fade/slide out smoothly, then remove it.
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Compact top-right badge notifications, a little down from the top edge */}
      <div className="fixed top-14 right-4 z-[9999] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 max-w-[calc(100vw-2rem)] bg-[#495464] text-[#F4F4F2] px-3 py-2 shadow-xl border border-[#BBBFCA]/30 text-[10px] sm:text-[11px] tracking-wider uppercase font-light select-none ${
              toast.leaving ? "animate-toast-out" : "animate-toast-in"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-[#BBBFCA] flex-shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-0.5 text-[#BBBFCA] hover:text-[#F4F4F2] transition-colors flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
