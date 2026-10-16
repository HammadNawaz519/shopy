"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] right-4 bottom-auto w-auto max-w-[calc(100vw-3rem)] items-end sm:top-auto sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:max-w-none z-[9999] flex flex-col gap-2.5 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-auto max-w-full sm:w-auto sm:max-w-md flex items-center justify-between gap-3 bg-[#495464] text-[#F4F4F2] px-4 sm:px-5 py-3.5 shadow-2xl border border-[#BBBFCA]/30 text-xs sm:text-sm tracking-wider uppercase font-light transition-all animate-slideDown select-none"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-[#BBBFCA] flex-shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              <span className="truncate sm:whitespace-normal">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-[#BBBFCA] hover:text-[#F4F4F2] transition-colors p-1 flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
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
