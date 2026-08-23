"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    promoCode,
    setPromoCode,
    serverCalculation,
    validateWithServer,
    isLoadingServer,
  } = useCart();

  const { showToast } = useToast();
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoCode(promoInput.trim().toUpperCase());
    const res = await validateWithServer(promoInput.trim().toUpperCase());
    setPromoLoading(false);

    if (res && res.promoApplied) {
      showToast(`Promo code ${res.promoApplied} applied!`, "success");
    } else {
      showToast("Invalid promo code. Try 'SHOPY10' or 'EDITORIAL15'", "error");
    }
  };

  if (!isOpen) return null;

  const freeShippingThreshold = 15000;
  const currentSubtotal = serverCalculation ? serverCalculation.subtotal : subtotal;
  const progressPercent = Math.min(100, (currentSubtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentSubtotal);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-[#F4F4F2] text-[#495464] h-full flex flex-col justify-between p-6 sm:p-8 z-10 shadow-2xl animate-slideLeft">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#BBBFCA]/30">
          <div>
            <h2 className="font-serif text-2xl tracking-widest font-medium">SHOPPING BAG</h2>
            <p className="text-xs text-[#495464]/70 tracking-editorial uppercase mt-1">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </p>
          </div>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 text-[#495464] hover:opacity-70 transition-opacity"
            aria-label="Close bag"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="py-4 border-b border-[#BBBFCA]/20">
          <div className="flex justify-between text-xs tracking-wider uppercase mb-2 text-[#495464]">
            {remainingForFreeShipping === 0 ? (
              <span className="font-medium text-emerald-700">Complimentary Standard Delivery Unlocked</span>
            ) : (
              <span>
                Add <span className="font-semibold">{formatPrice(remainingForFreeShipping)}</span> for Complimentary Delivery
              </span>
            )}
            <span className="text-[10px] text-[#495464]/60">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-1 bg-[#E8E8E8] overflow-hidden">
            <div
              className="h-full bg-[#495464] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto py-4 divide-y divide-[#BBBFCA]/20">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="mb-4 opacity-70">
                <img
                  src="/logo.svg"
                  alt="SHOPY"
                  className="h-6 w-auto"
                />
              </div>
              <span className="font-serif text-2xl text-[#495464]/80 italic mb-3">
                Your bag is currently empty
              </span>
              <p className="text-xs text-[#495464]/70 max-w-xs mb-8 tracking-wider">
                Discover our new seasonal essentials, artisanal fragrances, and tailored cuts.
              </p>
              <button
                onClick={closeCart}
                className="inline-block border border-[#495464] px-8 py-3 text-xs tracking-widest uppercase text-[#495464] hover:bg-[#495464] hover:text-[#F4F4F2] transition-all"
              >
                Explore Catalogue
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className="py-5 flex gap-4 items-start group"
              >
                <div className="relative w-20 h-24 bg-[#E8E8E8] flex-shrink-0 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-sm font-medium text-[#495464] leading-snug line-clamp-1">
                      {item.name}
                    </h3>
                    <button
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                      className="text-[#BBBFCA] hover:text-[#495464] transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-3 text-xs text-[#495464]/70 mt-1 tracking-wider">
                    <span>Size: {item.size}</span>
                    <span>•</span>
                    <span>{item.color}</span>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-[#BBBFCA]/40 bg-[#E8E8E8]/40">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.size, item.color, item.quantity - 1)
                        }
                        className="px-2.5 py-1 text-[#495464] hover:bg-[#E8E8E8] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-medium text-[#495464]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                        }
                        className="px-2.5 py-1 text-[#495464] hover:bg-[#E8E8E8] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-medium text-[#495464]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Checkout & Totals */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-[#BBBFCA]/30 space-y-4">
            {/* Promo Form */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="PROMO CODE (e.g. SHOPY10)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA]/50 pl-8 pr-3 py-2 text-xs tracking-wider uppercase text-[#495464] placeholder:text-[#495464]/50 focus:outline-none focus:border-[#495464]"
                />
              </div>
              <button
                type="submit"
                disabled={promoLoading}
                className="bg-[#495464] text-[#F4F4F2] px-4 py-2 text-xs tracking-widest uppercase hover:bg-[#363E4B] transition-colors disabled:opacity-50"
              >
                {promoLoading ? "..." : "Apply"}
              </button>
            </form>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs tracking-wider text-[#495464]/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(serverCalculation ? serverCalculation.subtotal : subtotal)}</span>
              </div>
              {serverCalculation && serverCalculation.discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Discount ({serverCalculation.promoApplied})</span>
                  <span>-{formatPrice(serverCalculation.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {serverCalculation
                    ? serverCalculation.shipping === 0
                      ? "Free"
                      : formatPrice(serverCalculation.shipping)
                    : subtotal > freeShippingThreshold
                    ? "Free"
                    : formatPrice(500)}
                </span>
              </div>
              <div className="flex justify-between text-base font-serif font-medium text-[#495464] pt-2 border-t border-[#BBBFCA]/20">
                <span>Total</span>
                <span>
                  {formatPrice(
                    serverCalculation
                      ? serverCalculation.total
                      : subtotal > freeShippingThreshold
                      ? subtotal
                      : subtotal + 500
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-3 bg-[#495464] text-[#F4F4F2] py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-[#363E4B] transition-all shadow-md group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full flex items-center justify-center border border-[#BBBFCA] text-[#495464] py-2.5 text-xs tracking-widest uppercase hover:border-[#495464] transition-colors"
              >
                View Full Bag
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#495464]/60 tracking-wider pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#495464]" />
              <span>Zero-Trust Server Verified • Encrypted Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
