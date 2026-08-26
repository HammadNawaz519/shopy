"use client";

import React, { useEffect, useState } from "react";
import { Plus, Tag, Trash2, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/lib/utils";

export default function AdminDiscountsPage() {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Custom Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDiscount, setDeletingDiscount] = useState<{ code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "10",
    minOrder: "5000",
    active: true,
  });

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/discounts");
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data.discounts || []);
      }
    } catch {
      showToast("Failed to load discount coupons.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.value) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Coupon created in database.", "success");
        setModalOpen(false);
        setFormData({ code: "", type: "percentage", value: "10", minOrder: "5000", active: true });
        fetchDiscounts();
      } else {
        showToast(data.error || "Failed to create coupon.", "error");
      }
    } catch {
      showToast("Network error creating coupon.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (code: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, active: !currentActive }),
      });
      if (res.ok) {
        showToast(`Coupon ${!currentActive ? "activated" : "deactivated"}`, "success");
        setDiscounts((prev) =>
          prev.map((d) => (d.code === code ? { ...d, active: !currentActive } : d))
        );
      }
    } catch {
      showToast("Error updating coupon status.", "error");
    }
  };

  const handleOpenDeleteModal = (code: string) => {
    setDeletingDiscount({ code });
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDiscount || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/discounts?code=${encodeURIComponent(deletingDiscount.code)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success !== false)) {
        setDeleteModalOpen(false);
        setDeletingDiscount(null);
        showToast(`✓ Promo code "${deletingDiscount.code}" removed.`, "success");
        setDiscounts((prev) => prev.filter((d) => d.code !== deletingDiscount.code));
      } else {
        const safeError =
          typeof data.error === "string"
            ? data.error
            : "We couldn't delete this coupon right now. Please try again.";
        setDeleteError(safeError);
      }
    } catch {
      setDeleteError("A network error occurred while contacting the server. Please check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Promotions & Coupons"
        subtitle="Manage Server-Side Discount Codes & Redemption Rules"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs flex justify-between items-center">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#495464]">Active Promo Campaigns</h2>
            <p className="text-xs text-[#495464]/60">All discount calculations verified server-side</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-4 py-2 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>

        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tracking-wider">
                <thead className="bg-[#E8E8E8]/70 border-b border-[#BBBFCA]/40 text-[#495464] uppercase text-[10px]">
                  <tr>
                    <th className="p-4 font-semibold">Code</th>
                    <th className="p-4 font-semibold">Discount Type</th>
                    <th className="p-4 font-semibold">Value</th>
                    <th className="p-4 font-semibold">Min. Order</th>
                    <th className="p-4 font-semibold">Usage Count</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {discounts.map((d) => (
                    <tr key={d.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-sm text-[#495464]">
                        {d.code}
                      </td>
                      <td className="p-4 uppercase text-[10px] text-[#495464]/80">
                        {d.type}
                      </td>
                      <td className="p-4 font-serif font-semibold text-sm text-[#495464]">
                        {d.type === "percentage" ? `${d.value}% OFF` : `Rs. ${d.value} OFF`}
                      </td>
                      <td className="p-4 text-[#495464]/80">
                        {d.minOrder > 0 ? formatPrice(d.minOrder) : "No Minimum"}
                      </td>
                      <td className="p-4 text-[#495464]/80 font-medium">
                        {d.usageCount || 0} times
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(d.code, d.active)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] uppercase font-semibold transition-colors ${
                            d.active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {d.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{d.active ? "Active" : "Disabled"}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenDeleteModal(d.code)}
                          className="p-1.5 text-[#495464] hover:text-black hover:bg-[#BBBFCA]/40 transition-colors"
                          title="Delete Promo Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-md bg-[#F4F4F2] text-[#495464] z-10 p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-[#BBBFCA]/40 pb-2">
                <h3 className="font-serif text-lg font-medium">Create Promo Code</h3>
                <button onClick={() => setModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateDiscount} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 uppercase font-mono font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Flat (PKR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold mb-1">Value *</label>
                    <input
                      type="number"
                      required
                      placeholder={formData.type === "percentage" ? "15" : "500"}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">Minimum Order Amount (PKR)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[#BBBFCA]/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 border border-[#BBBFCA] uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#495464] text-[#F4F4F2] px-4 py-1.5 uppercase font-medium"
                  >
                    {saving ? "Saving..." : "Create Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Custom Luxury Delete Coupon Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete Promo Campaign"
          description={`Are you sure you want to permanently remove discount code "${deletingDiscount?.code}"?`}
          entityName={deletingDiscount?.code}
          secondaryNote="Customers will no longer be able to apply this promotion code at checkout."
          confirmLabel="Delete Code"
          cancelLabel="Cancel"
          isDanger={true}
          isLoading={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteModalOpen(false);
              setDeletingDiscount(null);
              setDeleteError(null);
            }
          }}
        />
      </main>
    </div>
  );
}
