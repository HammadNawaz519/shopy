"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react";
import { useEnhancedAuth } from "@/context/EnhancedAuthContext";

interface NetworkStatusProps {
  showFullMessage?: boolean;
}

export default function NetworkStatus({ showFullMessage = false }: NetworkStatusProps) {
  const { isOffline, lastOnlineCheck, checkConnectivity } = useEnhancedAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [lastChange, setLastChange] = useState<number>(Date.now());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOffline !== null) {
      setIsVisible(true);
      setLastChange(Date.now());

      // Auto-hide after 5 seconds if online
      if (!isOffline) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [isOffline]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await checkConnectivity();
    } finally {
      setIsChecking(false);
    }
  };

  // Don't show anything if status is hidden
  if (!isVisible && !showFullMessage) {
    return null;
  }

  // Don't show persistent offline indicator in PWA standalone mode
  if (typeof window !== "undefined") {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone && isOffline && !showFullMessage) {
      return null;
    }
  }

  const statusText = isOffline
    ? "You are offline. Some features may be limited."
    : "You are back online.";

  const lastChecked = lastOnlineCheck
    ? `Last checked: ${new Date(lastOnlineCheck).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  return (
    <div
      className={`${
        showFullMessage ? "fixed inset-x-0 top-0 z-[100]" : "fixed top-4 right-4 z-[90]"
      }`}
    >
      <div
        className={`${
          showFullMessage
            ? "w-full bg-gradient-to-r from-[#F4F4F2] to-[#E8E8E8] border-b border-[#BBBFCA]/40 shadow-sm"
            : "max-w-sm bg-[#F4F4F2] border border-[#BBBFCA]/60 shadow-lg rounded-lg backdrop-blur-sm"
        }`}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isOffline
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-green-50 text-green-600 border border-green-200"
              }`}
            >
              {isOffline ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  isOffline ? "text-[#495464]" : "text-[#495464]"
                }`}
              >
                {statusText}
              </p>

              {showFullMessage && lastChecked && (
                <p className="text-xs text-[#495464]/60 mt-0.5">{lastChecked}</p>
              )}

              {isOffline && showFullMessage && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#495464]/70">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Browse cached products and categories</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#495464]/70">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>View your cart and saved items</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#495464]/70">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span>Checkout requires an internet connection</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#495464]/70">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span>New orders cannot be placed offline</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="text-xs text-[#495464]/60 hover:text-[#495464] px-2 py-1 rounded hover:bg-[#E8E8E8] transition-colors disabled:opacity-50"
            >
              {isChecking ? "Checking..." : "Check"}
            </button>

            {!showFullMessage && (
              <button
                onClick={() => setIsVisible(false)}
                className="text-[#495464]/40 hover:text-[#495464] p-1"
                aria-label="Close network status"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {isOffline && !showFullMessage && (
          <div className="px-4 pb-3 pt-0">
            <div className="h-1 w-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-amber-500 animate-pulse"
                style={{ width: "70%" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for checking network status in components
export function useNetworkStatus() {
  const { isOffline, checkConnectivity, lastOnlineCheck } = useEnhancedAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkNetwork = async () => {
    setIsChecking(true);
    try {
      return await checkConnectivity();
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isOnline: !isOffline,
    isOffline,
    isChecking,
    lastChecked: lastOnlineCheck,
    checkNetwork,
  };
}