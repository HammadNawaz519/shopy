"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { Lock, ArrowRight, Loader2, CheckCircle2, Banknote, CreditCard } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import StripePaymentButton from "@/components/checkout/StripePaymentButton";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, serverCalculation, validateWithServer, promoCode } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [methodsEnabled, setMethodsEnabled] = useState({
    cod: true,
    card: false,
  });
  // Card order created (PENDING) and waiting for the Stripe hand-off.
  const [pendingCardOrder, setPendingCardOrder] = useState<{
    orderId: string;
    orderNumber?: string;
  } | null>(null);

  const getShippingStorageKey = (u?: typeof user) => {
    return u && u.id ? `shopy_shipping_user_${u.id}` : `shopy_shipping_guest`;
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "Lahore",
    postalCode: "",
    province: "Punjab",
    paymentMethod: "card" as "cod" | "card",
  });

  // Clean up legacy shared global storage key
  useEffect(() => {
    try {
      localStorage.removeItem("shopy_checkout_shipping_v1");
    } catch {}
  }, []);

  // Restore saved shipping details specifically for the current authenticated user or guest
  useEffect(() => {
    const key = getShippingStorageKey(user);
    const names = user?.name ? user.name.split(" ") : [];
    const defaultFirstName = names[0] || "";
    const defaultLastName = names.slice(1).join(" ") || "";
    const defaultEmail = user?.email || "";

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Legacy saved "bank_transfer" selections map to the new card flow.
        const savedMethod: "cod" | "card" =
          parsed.paymentMethod === "cod" ? "cod" : "card";
        setFormData({
          firstName: parsed.firstName || defaultFirstName,
          lastName: parsed.lastName || defaultLastName,
          email: defaultEmail || parsed.email || "",
          phone: parsed.phone || "",
          address: parsed.address || "",
          city: parsed.city || "Lahore",
          postalCode: parsed.postalCode || "",
          province: parsed.province || "Punjab",
          paymentMethod: savedMethod,
        });
        return;
      }
    } catch {}

    // Fresh account state if no prior saved shipping address for this user
    setFormData({
      firstName: defaultFirstName,
      lastName: defaultLastName,
      email: defaultEmail,
      phone: "",
      address: "",
      city: "Lahore",
      postalCode: "",
      province: "Punjab",
      paymentMethod: "card",
    });
  }, [user]);

  useEffect(() => {
    document.title = "Checkout | SHOPY";
  }, []);

  useEffect(() => {
    async function fetchPaymentConfig() {
      try {
        const res = await fetch("/api/settings/payment", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const codOk = data.cod?.enabled ?? true;
          const cardOk = data.card?.enabled ?? false;
          setMethodsEnabled({ cod: codOk, card: cardOk });

          // Card is the primary method when it's live; fall back to COD when
          // the server hasn't enabled Stripe yet (or COD is the only option).
          setFormData((prev) => ({
            ...prev,
            paymentMethod: cardOk ? (prev.paymentMethod === "cod" ? "cod" : "card") : "cod",
          }));
        }
      } catch {}
    }
    fetchPaymentConfig();
  }, []);

  // Save a single shipping field and persist only to this user's scoped storage
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      try {
        const key = getShippingStorageKey(user);
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
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

    // Guard: require authentication before placing any order
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }

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

      // Admin COD blocklist: this customer must pay by card instead.
      if (res.status === 403 && data.error === "cod_blocked") {
        showToast(data.message || "Cash on Delivery is not available for your account. Please use card payment.", "error");
        if (methodsEnabled.card) {
          setFormData((prev) => ({ ...prev, paymentMethod: "card" }));
        }
        return;
      }

      if (res.ok && data.success) {
        clearCart();
        // Permanently persist the customer's shipping info for all future checkouts
        try {
          localStorage.setItem(getShippingStorageKey(user), JSON.stringify(formData));
        } catch {}
        if (formData.paymentMethod === "card") {
          // Order is PENDING - hand off to Stripe's hosted payment page.
          setPendingCardOrder({ orderId: data.orderId, orderNumber: data.orderNumber });
        } else {
          showToast("Order placed successfully!", "success");
          router.push(`/order-confirmation/${data.orderId}`);
        }
      } else {
        showToast(data.error || "Failed to place order. Please check inputs.", "error");
      }
    } catch {
      showToast("Network error occurred during checkout.", "error");
    } finally {
      setLoading(false);
    }
  };

  const clientSubtotal = items.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const calculatedSubtotal = serverCalculation && serverCalculation.subtotal > 0 ? serverCalculation.subtotal : clientSubtotal;
  const calculatedShipping = serverCalculation ? serverCalculation.shipping : (calculatedSubtotal === 0 || calculatedSubtotal >= 15000 ? 0 : 500);
  const calculatedDiscount = serverCalculation ? serverCalculation.discount : 0;
  const calculatedTotal = serverCalculation && serverCalculation.total > 0 ? serverCalculation.total : Math.max(0, calculatedSubtotal - calculatedDiscount + calculatedShipping);

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center py-6 border-b border-[#BBBFCA]/30 mb-12">
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
                    onChange={(e) => handleFieldChange("firstName", e.target.value)}
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
                    onChange={(e) => handleFieldChange("lastName", e.target.value)}
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
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#BBBFCA] px-4 py-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-[#495464] mb-1 font-medium">
                    Phone (WhatsApp / Payment Proof) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0300 1234567"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
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
                  onChange={(e) => handleFieldChange("address", e.target.value)}
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
                    onChange={(e) => handleFieldChange("city", e.target.value)}
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
                    onChange={(e) => handleFieldChange("province", e.target.value)}
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
                    onChange={(e) => handleFieldChange("postalCode", e.target.value)}
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

              <div className="space-y-4">
                {/* 1. Card (Stripe) - primary option, shown first */}
                {methodsEnabled.card && (
                  <label
                    className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                      formData.paymentMethod === "card"
                        ? "border-[#495464] bg-[#F4F4F2] shadow-xs"
                        : "border-[#BBBFCA]/50 bg-[#E8E8E8]/40 hover:border-[#495464]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={() => setFormData({ ...formData, paymentMethod: "card" })}
                      className="mt-1 accent-[#495464]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#495464]" />
                        <span className="text-xs uppercase tracking-widest font-semibold text-[#495464]">
                          Card (Stripe)
                        </span>
                        <span className="bg-[#495464] text-[#F4F4F2] text-[9px] uppercase tracking-widest px-2 py-0.5 font-medium">
                          Recommended
                        </span>
                      </div>
                      <span className="text-[11px] text-[#495464]/70 tracking-wider block mt-1">
                        Secure card payment - your order is confirmed the moment it&apos;s charged.
                      </span>
                    </div>
                  </label>
                )}

                {/* 2. Cash on Delivery - secondary option */}
                {methodsEnabled.cod && (
                  <label
                    className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                      formData.paymentMethod === "cod"
                        ? "border-[#495464] bg-[#F4F4F2] shadow-xs"
                        : "border-[#BBBFCA]/50 bg-[#E8E8E8]/40 hover:border-[#495464]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                      className="mt-1 accent-[#495464]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-[#495464]" />
                        <span className="text-xs uppercase tracking-widest font-semibold text-[#495464]">
                          Cash on Delivery
                        </span>
                      </div>
                      <span className="text-[11px] text-[#495464]/70 tracking-wider block mt-1">
                        Payment will be collected when your order is delivered.
                      </span>
                    </div>
                  </label>
                )}

                {/* Edge case: neither method is enabled on the server yet */}
                {!methodsEnabled.card && !methodsEnabled.cod && (
                  <p className="text-[11px] text-[#495464]/70 tracking-wider">
                    No payment methods are available right now. Please try again later.
                  </p>
                )}
              </div>

              {/* Card flow note: the order is created on confirmation and the
                  "Pay Securely with Stripe" button (below the summary) opens
                  Stripe's hosted payment page for that order. */}
              {formData.paymentMethod === "card" && methodsEnabled.card && (
                <div className="flex items-start gap-2 text-[10px] text-[#495464]/70 bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-3 animate-fadeIn">
                  <Lock className="w-4 h-4 text-[#495464]/70 flex-shrink-0 mt-0.5" />
                  <span>
                    Confirm the order to reserve your items, then you&apos;ll be redirected to
                    Stripe&apos;s secure payment page. Your order is confirmed as soon as the
                    card is charged.
                  </span>
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
                        src={item.image || "/editorial-craft.jpg"}
                        alt={item.name || "Product"}
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

              {user && pendingCardOrder ? (
                <div className="space-y-3">
                  <StripePaymentButton
                    orderId={pendingCardOrder.orderId}
                    items={items.map((i) => ({
                      productId: i.productId,
                      name: i.name,
                      price: i.price,
                      quantity: i.quantity,
                      image: i.image,
                    }))}
                    customerEmail={formData.email || user.email || ""}
                    total={calculatedTotal}
                  />
                  <Link
                    href={`/order-confirmation/${pendingCardOrder.orderId}`}
                    className="block w-full text-center text-[10px] uppercase tracking-widest text-[#495464]/70 hover:text-[#495464] transition-colors"
                  >
                    View Order Confirmation
                  </Link>
                </div>
              ) : user ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-[#495464] text-[#F4F4F2] py-3.5 sm:py-4 px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md disabled:opacity-50 text-center cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#F4F4F2]" />
                      <span className="truncate">Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">Confirm Order • {formatPrice(calculatedTotal)}</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </>
                  )}
                </button>
              ) : (
                <a
                  href="/login?redirect=/checkout"
                  className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-[#495464] text-[#F4F4F2] py-3.5 sm:py-4 px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md text-center"
                >
                  <span className="truncate">Log in or Sign Up to Purchase</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
