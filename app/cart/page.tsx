"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    promoCode,
    setPromoCode,
    serverCalculation,
    validateWithServer,
    clearCart,
  } = useCart();

  const { showToast } = useToast();
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    const code = promoInput.trim().toUpperCase();
    setPromoCode(code);
    const res = await validateWithServer(code);
    setPromoLoading(false);

    if (res && res.promoApplied) {
      showToast(`Promo code ${res.promoApplied} applied!`, "success");
    } else {
      showToast("Invalid promo code. Try 'SHOPY10' or 'EDITORIAL15'", "error");
    }
  };

  const freeShippingThreshold = 15000;
  const currentSubtotal = serverCalculation ? serverCalculation.subtotal : subtotal;
  const shippingFee = serverCalculation
    ? serverCalculation.shipping
    : currentSubtotal > freeShippingThreshold || currentSubtotal === 0
    ? 0
    : 500;
  const discountAmount = serverCalculation ? serverCalculation.discount : 0;
  const finalTotal = serverCalculation
    ? serverCalculation.total
    : Math.max(0, currentSubtotal - discountAmount + shippingFee);

  return (
    <div className="pt-28 pb-32 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center py-12 border-b border-[#BBBFCA]/30 mb-12">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2">
            YOUR SELECTIONS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#495464]">
            Shopping Bag
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-[#E8E8E8]/50 border border-[#BBBFCA]/30 p-12 max-w-2xl mx-auto">
            <span className="font-serif text-2xl text-[#495464] block mb-3">
              Your bag is currently empty
            </span>
            <p className="text-xs text-[#495464]/70 tracking-wider uppercase mb-8 max-w-sm mx-auto">
              Explore our contemporary silhouettes, tailored cuts, and artisanal fragrances.
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#495464] text-[#F4F4F2] px-8 py-3.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
            >
              Explore Creations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Items Table */}
            <div className="lg:col-span-8 space-y-6">
              <div className="hidden sm:grid grid-cols-12 pb-3 border-b border-[#BBBFCA]/30 text-[11px] uppercase tracking-widest text-[#495464]/70">
                <span className="col-span-6">Product</span>
                <span className="col-span-3 text-center">Quantity</span>
                <span className="col-span-3 text-right">Total</span>
              </div>

              <div className="divide-y divide-[#BBBFCA]/20">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
                  >
                    {/* Image & Details */}
                    <div className="sm:col-span-6 flex gap-4 items-center">
                      <div className="relative w-20 h-24 bg-[#E8E8E8] flex-shrink-0 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-medium text-[#495464]">
                          {item.name}
                        </h3>
                        <div className="flex gap-3 text-xs text-[#495464]/70 mt-1 tracking-wider">
                          <span>Size: {item.size}</span>
                          <span>•</span>
                          <span>{item.color}</span>
                        </div>
                        <span className="text-xs text-[#495464]/80 mt-1 block">
                          {formatPrice(item.price)} each
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="sm:col-span-3 flex justify-start sm:justify-center items-center">
                      <div className="flex items-center border border-[#BBBFCA] bg-[#E8E8E8]">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              item.quantity - 1
                            )
                          }
                          className="px-2.5 py-1 text-[#495464] hover:bg-[#BBBFCA]/30"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-medium text-[#495464]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              item.quantity + 1
                            )
                          }
                          className="px-2.5 py-1 text-[#495464] hover:bg-[#BBBFCA]/30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Total & Remove */}
                    <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-4">
                      <span className="font-medium text-sm text-[#495464]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="text-[#BBBFCA] hover:text-[#495464] transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                <Link
                  href="/products"
                  className="text-xs uppercase tracking-widest text-[#495464] hover:underline"
                >
                  ← Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  className="text-xs uppercase tracking-widest text-[#495464]/60 hover:text-[#495464]"
                >
                  Clear Bag
                </button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-8 space-y-6">
                <h2 className="font-serif text-xl font-medium tracking-wide text-[#495464]">
                  Summary
                </h2>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#495464]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="PROMO CODE"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full bg-[#F4F4F2] border border-[#BBBFCA] pl-8 pr-3 py-2.5 text-xs uppercase tracking-wider text-[#495464] focus:outline-none focus:border-[#495464]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promoLoading}
                    className="bg-[#495464] text-[#F4F4F2] px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-[#363E4B] transition-colors"
                  >
                    {promoLoading ? "..." : "Apply"}
                  </button>
                </form>

                {/* Line Items */}
                <div className="space-y-3 text-xs tracking-wider text-[#495464]/80 border-t border-[#BBBFCA]/30 pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(currentSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Discount ({serverCalculation?.promoApplied})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Estimated Shipping</span>
                    <span>{shippingFee === 0 ? "Complimentary" : formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-serif font-medium text-[#495464] pt-4 border-t border-[#BBBFCA]/30">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-3 bg-[#495464] text-[#F4F4F2] py-4 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md group"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-center gap-2 text-[10px] text-[#495464]/60 tracking-wider text-center">
                  <ShieldCheck className="w-4 h-4 text-[#495464]" />
                  <span>Prices verified server-side. Secure checkout.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
