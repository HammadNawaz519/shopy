"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Loader2, CheckCircle2, ShieldCheck, UserX, Trash2 } from "lucide-react";
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

  // COD blocklist (saved independently via /api/admin/blocked-users).
  // Adding/removing is instant: each action pushes the whole list to the
  // server, so the block applies to the store immediately.
  const [blockedList, setBlockedList] = useState<string[]>([]);
  const [newBlockedEmail, setNewBlockedEmail] = useState("");
  const [blockedBusy, setBlockedBusy] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.settings) setSettings(json.settings);
        }
        const bRes = await fetch("/api/admin/blocked-users");
        if (bRes.ok) {
          const bData = await bRes.json();
          setBlockedList(bData.emails || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Replace the whole blocklist server-side; returns true on success.
  const saveBlockedList = async (list: string[]) => {
    try {
      const res = await fetch("/api/admin/blocked-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: list }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlockedList(data.emails || list);
        return true;
      }
      showToast(data.error || "Failed to update blocked users.", "error");
      return false;
    } catch {
      showToast("Network error saving blocked users.", "error");
      return false;
    }
  };

  const handleAddBlocked = async () => {
    const email = newBlockedEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Enter a valid email address to block.", "error");
      return;
    }
    if (blockedList.includes(email)) {
      showToast("That email is already blocked.", "info");
      setNewBlockedEmail("");
      return;
    }
    setBlockedBusy(true);
    const ok = await saveBlockedList([...blockedList, email]);
    setBlockedBusy(false);
    if (ok) {
      setNewBlockedEmail("");
      showToast(`${email} is now blocked from Cash on Delivery.`, "success");
    }
  };

  const handleRemoveBlocked = async (email: string) => {
    setBlockedBusy(true);
    const ok = await saveBlockedList(blockedList.filter((e) => e !== email));
    setBlockedBusy(false);
    if (ok) showToast(`${email} can use Cash on Delivery again.`, "success");
  };

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

          {/* Section 4: COD Blocklist - email input on top, blocked-users
              list (orders-style rows) underneath. */}
          <div className="pt-6 border-t border-[#BBBFCA]/40">
            <div className="border-b border-[#BBBFCA]/30 pb-4 mb-6">
              <h2 className="font-serif text-xl font-medium text-[#495464]">Blocked Users (COD)</h2>
              <p className="text-xs text-[#495464]/60 uppercase tracking-widest mt-0.5">
                Emails on this list are blocked from ordering via Cash on Delivery.
              </p>
            </div>

            <div className="text-xs space-y-4">
              {/* 1. Add email */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  placeholder="customer@gmail.com"
                  value={newBlockedEmail}
                  onChange={(e) => setNewBlockedEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBlocked();
                    }
                  }}
                  className="flex-1 bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2.5 font-mono text-[11px] text-[#495464] placeholder:text-[#495464]/35"
                />
                <button
                  type="button"
                  onClick={handleAddBlocked}
                  disabled={blockedBusy || !newBlockedEmail.trim()}
                  className="inline-flex items-center justify-center gap-2 bg-[#8B2C2C] text-[#F4F4F2] px-5 py-2.5 text-[10px] uppercase tracking-widest font-semibold hover:bg-[#7A2525] transition-colors disabled:opacity-40"
                >
                  <UserX className="w-3.5 h-3.5" />
                  {blockedBusy ? "Saving..." : "Block From COD"}
                </button>
              </div>

              {/* 2. Blocked users list (orders-style rows) */}
              <div className="space-y-2">
                {blockedList.length === 0 ? (
                  <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 px-4 py-5 text-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#495464]/50 font-mono">
                      No blocked users yet
                    </span>
                  </div>
                ) : (
                  blockedList.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between gap-3 bg-[#E8E8E8]/60 border border-[#BBBFCA]/40 px-3.5 py-2.5 animate-fadeIn"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-semibold text-[#495464] truncate">{email}</p>
                        <p className="text-[9px] uppercase tracking-widest text-[#495464]/55 mt-0.5">
                          Blocked From Cash On Delivery
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlocked(email)}
                        disabled={blockedBusy}
                        title="Unblock this email"
                        className="shrink-0 p-2 text-[#8B2C2C] hover:bg-[#8B2C2C] hover:text-[#F4F4F2] transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <p className="text-[10px] text-[#495464]/60 leading-relaxed">
                Blocked customers are still able to place orders with Bank Transfer / Raast -
                only Cash on Delivery is rejected for them, instantly, on every order attempt.
              </p>
            </div>
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
