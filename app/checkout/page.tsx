"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { ShieldCheck, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, serverCalculation, validateWithServer, promoCode } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user ? user.email : "",
    phone: "",
    address: "",
    city: "Lahore",
    postalCode: "",
    province: "Punjab",
    paymentMethod: "cod" as "cod" | "card",
  });

  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardExp: "",
    cardCvc: "",
  });

  useEffect(() => {
    if (user && !formData.email) {
      const names = user.name.split(" ");
      setFormData((prev) => ({
        ...prev,
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        email: user.email,
      }));
    }
  }, [user, formData.email]);

  useEffect(() => {
    validateWithServer();
  }, [validateWithServer]);

  if (items.length === 0) {
    return (
      <div className="pt-36 pb-32 text-center bg-[#F4F4F2] text-[#495464]">
        <div className="max-w-md mx-auto px-6">
          <h1 className="font-serif text-3xl mb-3">Your Bag is Empty</h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mb-8">
            Please add pieces to your shopping bag prior to checking out.
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#495464] text-[#F4F4F2] px-8 py-3 text-xs uppercase tracking-widest"
          >
            Explore Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          province: formData.province,
        },
        paymentMethod: formData.paymentMethod,
        promoCode: promoCode || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        clearCart();
        showToast("Order placed successfully!", "success");
        router.push(`/order-confirmation/${data.orderId}`);
      } else {
        showToast(data.error || "Failed to place order. Please check inputs.", "error");
      }
    } catch {
      showToast("Network error occurred during checkout.", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculatedSubtotal = serverCalculation ? serverCalculation.subtotal : 0;
  const calculatedShipping = serverCalculation ? serverCalculation.shipping : 0;
  const calculatedDiscount = serverCalculation ? serverCalculation.discount : 0;
  const calculatedTotal = serverCalculation ? serverCalculation.total : 0;

  return (
    <div className="pt-28 pb-32 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center py-8 border-b border-[#BBBFCA]/30 mb-12">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-1">
            SECURE ATELIER DISPATCH
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#495464]">
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Shipping & Payment Form */}
          <div className="lg:col-span-7 space-y-10">
            {/* Step 1: Customer Details */}
            <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-3">
                <h2 className="font-serif text-xl font-medium uppercase tracking-wide text-[#495464]">
                  1. Contact &amp; Shipping Destination
                </h2>
                <span className="text-xs text-[#495464]/60 uppercase tracking-widest">
                  Pakistan Courier
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Phone (WhatsApp Contact) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                  Street Address &amp; House/Apartment *
                </label>
                <input
                  type="text"
                  required
                  placeholder="House 42, Street 8, Block C, Gulberg"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    City *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Sialkot">Sialkot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Province *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="54000"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-3">
                <h2 className="font-serif text-xl font-medium uppercase tracking-wide text-[#495464]">
                  2. Payment Method
                </h2>
                <Lock className="w-4 h-4 text-[#495464]/70" />
              </div>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label
                  className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                    formData.paymentMethod === "cod"
                      ? "border-[#495464] bg-[#F4F4F2]"
                      : "border-[#BBBFCA]/50 bg-[#E8E8E8]/50 hover:border-[#495464]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === "cod"}
                    onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs uppercase tracking-widest font-semibold text-[#495464] block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-[#495464]/70 tracking-wider block mt-0.5">
                      Pay upon delivery to our courier. Nationwide available across Pakistan.
                    </span>
                  </div>
                </label>

                {/* Card Payment (Mock Demo) */}
                <label
                  className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                    formData.paymentMethod === "card"
                      ? "border-[#495464] bg-[#F4F4F2]"
                      : "border-[#BBBFCA]/50 bg-[#E8E8E8]/50 hover:border-[#495464]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === "card"}
                    onChange={() => setFormData({ ...formData, paymentMethod: "card" })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs uppercase tracking-widest font-semibold text-[#495464] block">
                      Debit / Credit Card (Encrypted)
                    </span>
                    <span className="text-[11px] text-[#495464]/70 tracking-wider block mt-0.5">
                      Visa, Mastercard, PayPak. Direct 256-bit TLS encrypted processing.
                    </span>
                  </div>
                </label>
              </div>

              {formData.paymentMethod === "card" && (
                <div className="p-4 bg-[#F4F4F2] border border-[#BBBFCA]/60 space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2 text-xs text-[#495464] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardData.cardExp}
                        onChange={(e) => setCardData({ ...cardData, cardExp: e.target.value })}
                        className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2 text-xs text-[#495464] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                        CVC / CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardData.cardCvc}
                        onChange={(e) => setCardData({ ...cardData, cardCvc: e.target.value })}
                        className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2 text-xs text-[#495464] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-8 space-y-6 sticky top-28">
              <h2 className="font-serif text-xl font-medium tracking-wide text-[#495464] border-b border-[#BBBFCA]/30 pb-3">
                Order Review ({items.length})
              </h2>

              {/* Items Mini List */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 divide-y divide-[#BBBFCA]/20">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="pt-3 first:pt-0 flex gap-3 items-center"
                  >
                    <div className="relative w-14 h-16 bg-[#E8E8E8] flex-shrink-0 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-xs font-medium text-[#495464] line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-[#495464]/60 tracking-wider">
                        Qty: {item.quantity} • {item.size} • {item.color}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#495464]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs tracking-wider text-[#495464]/80 border-t border-[#BBBFCA]/30 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculatedSubtotal)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>Discount ({serverCalculation?.promoApplied})</span>
                    <span>-{formatPrice(calculatedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insured Shipping</span>
                  <span>{calculatedShipping === 0 ? "Complimentary" : formatPrice(calculatedShipping)}</span>
                </div>
                <div className="flex justify-between text-lg font-serif font-medium text-[#495464] pt-4 border-t border-[#BBBFCA]/30">
                  <span>Total Due</span>
                  <span>{formatPrice(calculatedTotal)}</span>
                </div>
              </div>

              {/* Confirm & Place Order CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#495464] text-[#F4F4F2] py-4 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating &amp; Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order • {formatPrice(calculatedTotal)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#495464]/60 tracking-wider text-center">
                <ShieldCheck className="w-4 h-4 text-[#495464]" />
                <span>Zero-Trust Server Validation • Guaranteed Authenticity</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
