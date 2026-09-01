"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { Lock, ArrowRight, Loader2, CheckCircle2, Building2, Banknote, Copy, Check, Info } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, serverCalculation, validateWithServer, promoCode } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [methodsEnabled, setMethodsEnabled] = useState({
    cod: true,
    bankTransfer: true,
  });
  const [bankSettings, setBankSettings] = useState<any>({
    accountHolderName: "SHOPY Retail Private Limited",
    accountTitle: "SHOPY Main Operations",
    bankName: "Meezan Bank Limited",
    accountNumber: "01020304050607",
    iban: "PK12MEZN0001020304050607",
    raastId: "03001234567",
    paymentContact: "+92 300 1234567",
    instructions: "Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.",
  });

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
    paymentMethod: "cod" as "cod" | "bank_transfer",
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
        setFormData({
          firstName: parsed.firstName || defaultFirstName,
          lastName: parsed.lastName || defaultLastName,
          email: defaultEmail || parsed.email || "",
          phone: parsed.phone || "",
          address: parsed.address || "",
          city: parsed.city || "Lahore",
          postalCode: parsed.postalCode || "",
          province: parsed.province || "Punjab",
          paymentMethod: parsed.paymentMethod || "cod",
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
      paymentMethod: "cod",
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
          const bankOk = (data.bankTransfer?.enabled ?? data.online?.enabled) ?? true;
          setMethodsEnabled({ cod: codOk, bankTransfer: bankOk });

          if (!codOk && bankOk) {
            setFormData((prev) => ({ ...prev, paymentMethod: "bank_transfer" }));
          }

          const details = data.bankTransfer?.bankDetails || data.online?.bankDetails;
          if (details) {
            setBankSettings(details);
          }
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
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`${label} copied to clipboard`, "info");
    setTimeout(() => setCopiedField(null), 2000);
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
        // Permanently persist the customer's shipping info for all future checkouts
        try {
          localStorage.setItem(getShippingStorageKey(user), JSON.stringify(formData));
        } catch {}
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
                {/* 1. Cash on Delivery */}
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

                {/* 2. Bank Transfer / Raast */}
                {methodsEnabled.bankTransfer && (
                  <label
                    className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                      formData.paymentMethod === "bank_transfer"
                        ? "border-[#495464] bg-[#F4F4F2] shadow-xs"
                        : "border-[#BBBFCA]/50 bg-[#E8E8E8]/40 hover:border-[#495464]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === "bank_transfer"}
                      onChange={() => setFormData({ ...formData, paymentMethod: "bank_transfer" })}
                      className="mt-1 accent-[#495464]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#495464]" />
                        <span className="text-xs uppercase tracking-widest font-semibold text-[#495464]">
                          Bank Transfer / Raast
                        </span>
                      </div>
                      <span className="text-[11px] text-[#495464]/70 tracking-wider block mt-1">
                        Direct bank transfer or instant Raast payment.
                      </span>
                    </div>
                  </label>
                )}
              </div>

              {/* Dynamic Online Bank Transfer Details Box */}
              {formData.paymentMethod === "bank_transfer" && (
                <div className="p-6 bg-[#F4F4F2] border border-[#495464]/40 space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#BBBFCA]/40 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#495464]/70 block">
                        Direct Atelier Bank Account
                      </span>
                      <h4 className="font-serif text-base font-semibold text-[#495464]">
                        {bankSettings.bankName || "Meezan Bank Limited"}
                      </h4>
                    </div>
                    <span className="bg-[#495464] text-[#F4F4F2] text-[9px] uppercase tracking-widest px-2.5 py-1 font-medium">
                      Official Account
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-3">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/70 block mb-0.5">
                        Account Holder
                      </span>
                      <p className="font-medium text-sm text-[#495464]">{bankSettings.accountHolderName || "SHOPY Retail Private Limited"}</p>
                    </div>

                    {bankSettings.accountTitle && (
                      <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-3">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/70 block mb-0.5">
                          Account Title
                        </span>
                        <p className="font-medium text-sm text-[#495464]">{bankSettings.accountTitle}</p>
                      </div>
                    )}

                    <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/70 block mb-0.5">
                          Account Number
                        </span>
                        <p className="font-mono font-bold text-xs text-[#495464]">{bankSettings.accountNumber || "01020304050607"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankSettings.accountNumber, "Account Number")}
                        className="p-1.5 bg-[#F4F4F2] border border-[#BBBFCA] hover:bg-white text-[#495464] transition-colors"
                        title="Copy Account Number"
                      >
                        {copiedField === "Account Number" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/70 block mb-0.5">
                          IBAN Number
                        </span>
                        <p className="font-mono font-bold text-xs text-[#495464]">{bankSettings.bankIban || bankSettings.iban || "PK12MEZN0001020304050607"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankSettings.bankIban || bankSettings.iban, "IBAN")}
                        className="p-1.5 bg-[#F4F4F2] border border-[#BBBFCA] hover:bg-white text-[#495464] transition-colors"
                        title="Copy IBAN"
                      >
                        {copiedField === "IBAN" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {bankSettings.raastId && (
                      <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-3 flex items-center justify-between sm:col-span-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]/70 block mb-0.5">
                            Raast ID / Instant Mobile Transfer
                          </span>
                          <p className="font-mono font-bold text-xs text-[#495464]">{bankSettings.raastId}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankSettings.raastId, "Raast ID")}
                          className="p-1.5 bg-[#F4F4F2] border border-[#BBBFCA] hover:bg-white text-[#495464] transition-colors"
                          title="Copy Raast ID"
                        >
                          {copiedField === "Raast ID" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {bankSettings.paymentContact && (
                    <div className="flex items-center justify-between bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 px-3.5 py-2.5 text-xs text-[#495464]">
                      <span className="text-[11px] font-medium">WhatsApp Payment Support:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bankSettings.paymentContact}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankSettings.paymentContact, "Payment Contact")}
                          className="p-1 bg-[#F4F4F2] border border-[#BBBFCA] hover:bg-white text-[#495464]"
                          title="Copy Contact"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {bankSettings.instructions && (
                    <div className="bg-[#E8E8E8]/30 border-l-2 border-[#495464] p-3 text-[11px] text-[#495464]/90 leading-relaxed">
                      <p className="font-semibold uppercase tracking-wider text-[10px] text-[#495464] mb-1">
                        Instructions:
                      </p>
                      <p>{bankSettings.instructions}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-[10px] text-[#495464]/70 bg-amber-50/70 border border-amber-200/60 p-3">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span>
                      Your order will be reserved upon placement. Fulfillment starts once our team verifies your payment.
                    </span>
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

              {/* Confirm & Place Order CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-[#495464] text-[#F4F4F2] py-3.5 sm:py-4 px-4 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium hover:bg-[#363E4B] transition-all shadow-md disabled:opacity-50 text-center cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F4F4F2]" />
                    <span className="truncate">Validating &amp; Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">Confirm Order • {formatPrice(calculatedTotal)}</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
