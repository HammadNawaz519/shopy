"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, Save, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/context/ToastContext";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: "SHOPY Atelier",
    supportEmail: "shopy.support@gmail.com",
    currency: "PKR",
    currencySymbol: "Rs.",
    freeShippingThreshold: 15000,
    flatShippingRate: 500,
    inventoryAlertThreshold: 5,
    orderNotifications: true,
    codEnabled: true,
    bankTransferEnabled: true,
    bankAccountHolder: "SHOPY Retail Private Limited",
    bankAccountTitle: "SHOPY Main Operations",
    bankName: "Meezan Bank Limited",
    bankAccountNumber: "01020304050607",
    bankIban: "PK12MEZN0001020304050607",
    bankRaastId: "03001234567",
    bankPaymentContact: "+92 300 1234567",
    bankPaymentInstructions: "Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.",
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.settings) setSettings(json.settings);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.settings) setSettings(data.settings);
        showToast("Store operations & payment settings updated.", "success");
      } else {
        showToast(data.error || "Failed to update settings.", "error");
      }
    } catch {
      showToast("Network error saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Store Settings"
          subtitle="Operational Defaults, Fulfillment Rules & Notifications"
        />
        <div className="flex-1 flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#495464]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Store Settings"
        subtitle="Operational Defaults, Payment Details & Fulfillment Rules"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1000px] w-full mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-8">
          {/* Section 1: Store Operations */}
          <div>
            <div className="border-b border-[#BBBFCA]/30 pb-4 mb-6">
              <h2 className="font-serif text-xl font-medium text-[#495464]">Store Configuration</h2>
              <p className="text-xs text-[#495464]/60 uppercase tracking-widest mt-0.5">
                These settings govern server-side shipping, thresholds, and currency formatting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Store Front Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Support Email Address
                </label>
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Base Currency Code
                </label>
                <input
                  type="text"
                  required
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  required
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Complimentary Shipping Threshold (PKR)
                </label>
                <input
                  type="number"
                  required
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5"
                />
                <p className="text-[10px] text-[#495464]/60 mt-1">Orders above this receive free delivery.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Standard Shipping Fee (PKR)
                </label>
                <input
                  type="number"
                  required
                  value={settings.flatShippingRate}
                  onChange={(e) => setSettings({ ...settings, flatShippingRate: Number(e.target.value) })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5"
                />
                <p className="text-[10px] text-[#495464]/60 mt-1">Flat rate for orders below threshold.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Low-Stock Threshold Alert (Units)
                </label>
                <input
                  type="number"
                  required
                  value={settings.inventoryAlertThreshold}
                  onChange={(e) => setSettings({ ...settings, inventoryAlertThreshold: Number(e.target.value) })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Active Payment Methods */}
          <div className="pt-6 border-t border-[#BBBFCA]/40">
            <div className="border-b border-[#BBBFCA]/30 pb-4 mb-6">
              <h2 className="font-serif text-xl font-medium text-[#495464]">Payment Methods</h2>
              <p className="text-xs text-[#495464]/60 uppercase tracking-widest mt-0.5">
                Enable or disable customer-facing payment gateways at checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <label className="flex items-start gap-3 p-4 bg-[#E8E8E8] border border-[#BBBFCA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.codEnabled ?? true}
                  onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                  className="mt-1 accent-[#495464]"
                />
                <div>
                  <span className="font-semibold uppercase tracking-wider text-[#495464] block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[10px] text-[#495464]/70 block mt-0.5">
                    Allow customers to pay in cash upon physical parcel delivery.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-[#E8E8E8] border border-[#BBBFCA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bankTransferEnabled ?? true}
                  onChange={(e) => setSettings({ ...settings, bankTransferEnabled: e.target.checked })}
                  className="mt-1 accent-[#495464]"
                />
                <div>
                  <span className="font-semibold uppercase tracking-wider text-[#495464] block">
                    Bank Transfer / Raast
                  </span>
                  <span className="text-[10px] text-[#495464]/70 block mt-0.5">
                    Allow direct bank transfers and instant Raast payments.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Online Banking & Bank Transfer Details */}
          <div className="pt-6 border-t border-[#BBBFCA]/40">
            <div className="border-b border-[#BBBFCA]/30 pb-4 mb-6">
              <h2 className="font-serif text-xl font-medium text-[#495464]">Bank Transfer / Raast Details</h2>
              <p className="text-xs text-[#495464]/60 uppercase tracking-widest mt-0.5">
                These details are shown to customers when selecting &ldquo;Bank Transfer / Raast&rdquo; at checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHOPY Retail Private Limited"
                  value={settings.bankAccountHolder || ""}
                  onChange={(e) => setSettings({ ...settings, bankAccountHolder: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-medium text-[#495464]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Account Title / Operations
                </label>
                <input
                  type="text"
                  placeholder="e.g. SHOPY Main Operations"
                  value={settings.bankAccountTitle || ""}
                  onChange={(e) => setSettings({ ...settings, bankAccountTitle: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-medium text-[#495464]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Bank Limited / HBL / Standard Chartered"
                  value={settings.bankName || ""}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-medium text-[#495464]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01020304050607"
                  value={settings.bankAccountNumber || ""}
                  onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-mono text-[#495464]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  IBAN Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PK12MEZN0001020304050607"
                  value={settings.bankIban || ""}
                  onChange={(e) => setSettings({ ...settings, bankIban: e.target.value.toUpperCase() })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-mono uppercase text-[#495464]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Raast ID / Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 03001234567"
                  value={settings.bankRaastId || ""}
                  onChange={(e) => setSettings({ ...settings, bankRaastId: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-mono text-[#495464]"
                />
                <p className="text-[10px] text-[#495464]/60 mt-1">For instant Raast P2M/P2P transfers.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Payment Verification Contact (WhatsApp / Phone) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={settings.bankPaymentContact || ""}
                  onChange={(e) => setSettings({ ...settings, bankPaymentContact: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 text-[#495464]"
                />
                <p className="text-[10px] text-[#495464]/60 mt-1">Contact where clients send payment transfer screenshots.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                  Payment Instructions &amp; Transfer Notice
                </label>
                <textarea
                  rows={3}
                  placeholder="Instructions displayed to customer when placing a Bank Transfer / Raast order..."
                  value={settings.bankPaymentInstructions || ""}
                  onChange={(e) => setSettings({ ...settings, bankPaymentInstructions: e.target.value })}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-3 text-xs text-[#495464]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: pointer to the dedicated Blocked panel (side menu) */}
          <div className="pt-6 border-t border-[#BBBFCA]/40">
            <div className="border-b border-[#BBBFCA]/30 pb-4 mb-5">
              <h2 className="font-serif text-xl font-medium text-[#495464]">Blocked Users (COD)</h2>
              <p className="text-xs text-[#495464]/60 uppercase tracking-widest mt-0.5">
                The Cash-on-Delivery blocklist is managed from its own panel.
              </p>
            </div>
            <Link
              href="/admin/blocked-users"
              className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-5 py-2.5 text-[10px] uppercase tracking-widest font-semibold hover:bg-[#363E4B] transition-colors"
            >
              Open Blocked Panel
            </Link>
          </div>

          <div className="pt-6 border-t border-[#BBBFCA]/30 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Store Configuration"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
