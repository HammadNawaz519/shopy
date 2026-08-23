"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/context/ToastContext";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: "SHOPY Atelier",
    supportEmail: "concierge@shopy.com",
    currency: "PKR",
    currencySymbol: "Rs.",
    freeShippingThreshold: 15000,
    flatShippingRate: 500,
    inventoryAlertThreshold: 5,
    orderNotifications: true,
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
        showToast("Store operations settings updated.", "success");
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
        subtitle="Operational Defaults, Fulfillment Rules & Notifications"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1000px] w-full mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-8">
          <div className="border-b border-[#BBBFCA]/30 pb-4">
            <h2 className="font-serif text-xl font-medium text-[#495464]">Store Configuration</h2>
            <p className="text-xs text-[#495464]/60 uppercase tracking-widest mt-0.5">
              These settings govern server-side shipping, thresholds, and currency formatting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#495464] mb-1">
                Storefront Name
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
                Concierge / Support Email
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
                Currency Code
              </label>
              <input
                type="text"
                required
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
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
