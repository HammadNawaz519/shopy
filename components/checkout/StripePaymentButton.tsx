"use client";

import React, { useState } from "react";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface StripePaymentButtonProps {
  /** Order created via /api/orders with paymentMethod "card" (status PENDING). */
  orderId: string;
  items: { productId: string; name?: string; price: number; quantity: number; image?: string }[];
  customerEmail: string;
  total?: number;
  className?: string;
  onSuccess?: () => void;
}

/**
 * "Pay with Stripe" button: calls /api/checkout/stripe to create a hosted
 * Checkout Session for the already-created order, then redirects the browser
 * to Stripe's secure payment page. Success/cancellation land back on
 * /order-confirmation/[id] (success) or /checkout (cancel).
 */
export default function StripePaymentButton({
  orderId,
  items,
  customerEmail,
  total,
  className,
  onSuccess,
}: StripePaymentButtonProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          items,
          customerEmail,
          // Keep the exact amount visible on the button if provided.
          ...(total !== undefined ? { total } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        onSuccess?.();
        window.location.href = data.url;
        return;
      }
      if (res.status === 503 && (data.error === "stripe_not_configured" || /not configured/i.test(data.message || ""))) {
        showToast("Card payment is not active. Please use Cash on Delivery.", "error");
        return;
      }
      showToast(data.message || data.error || "Could not start the Stripe payment.", "error");
    } catch {
      showToast("Network error starting the Stripe payment.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ||
        "w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-[#495464] text-[#F4F4F2] py-3.5 sm:py-4 px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md disabled:opacity-50 text-center cursor-pointer"
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[#F4F4F2]" />
          <span className="truncate">Starting Stripe Payment...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Pay Securely with Stripe</span>
          <Lock className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
        </>
      )}
    </button>
  );
}
