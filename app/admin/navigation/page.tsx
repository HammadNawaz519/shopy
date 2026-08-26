"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useToast } from "@/context/ToastContext";

interface NavItem {
  id: string;
  name: string;
  href: string;
  orderIndex: number;
  isActive: boolean;
  categorySlug?: string;
}

export default function AdminNavigationPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);

  // Custom Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingNav, setDeletingNav] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [href, setHref] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [categorySlug, setCategorySlug] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNavItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/navigation");
      if (res.ok) {
        const data = await res.json();
        setItems(data.navigation || []);
      }
    } catch {
      showToast("Failed to load navigation items.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setHref("/");
    setOrderIndex(items.length);
    setIsActive(true);
    setCategorySlug("");
    setModalOpen(true);
  };

  const openEditModal = (item: NavItem) => {
    setEditingItem(item);
    setName(item.name);
    setHref(item.href);
    setOrderIndex(item.orderIndex);
    setIsActive(item.isActive);
    setCategorySlug(item.categorySlug || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !href.trim()) return;

    setSaving(true);
    try {
      if (editingItem) {
        // Update
        const res = await fetch("/api/admin/navigation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            name: name.trim().toLowerCase(),
            href: href.trim(),
            orderIndex: Number(orderIndex),
            isActive,
            categorySlug: categorySlug.trim() || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Navigation link updated successfully.", "success");
          setModalOpen(false);
          fetchNavItems();
        } else {
          showToast(data.error || "Failed to update item.", "error");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/navigation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim().toLowerCase(),
            href: href.trim(),
            orderIndex: Number(orderIndex),
            isActive,
            categorySlug: categorySlug.trim() || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("New navigation link published.", "success");
          setModalOpen(false);
          fetchNavItems();
        } else {
          showToast(data.error || "Failed to create item.", "error");
        }
      }
    } catch {
      showToast("Network error saving navigation link.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (item: NavItem) => {
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      });
      if (res.ok) {
        showToast(
          `Link "${item.name}" ${!item.isActive ? "enabled" : "hidden"} on storefront.`,
          "success"
        );
        fetchNavItems();
      }
    } catch {
      showToast("Failed to toggle link visibility.", "error");
    }
  };

  const handleOpenDeleteModal = (item: NavItem) => {
    setDeletingNav({ id: item.id, name: item.name });
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNav || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/navigation?id=${encodeURIComponent(deletingNav.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success !== false)) {
        setDeleteModalOpen(false);
        setDeletingNav(null);
        showToast(`✓ Navigation link "${deletingNav.name}" removed.`, "success");
        fetchNavItems();
      } else {
        const safeError =
          typeof data.error === "string"
            ? data.error
            : "We couldn't remove this navigation link right now. Please try again.";
        setDeleteError(safeError);
      }
    } catch {
      setDeleteError("A network error occurred while contacting the server. Please check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const currentItem = items[index];
    const targetItem = items[targetIndex];

    try {
      await fetch("/api/admin/navigation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentItem.id, orderIndex: targetItem.orderIndex }),
      });
      await fetch("/api/admin/navigation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetItem.id, orderIndex: currentItem.orderIndex }),
      });
      fetchNavItems();
    } catch {
      showToast("Failed to update ordering.", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Header & Navigation Architecture"
        subtitle="Manage Storefront Navbar Links, Order, and Category Routing"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-8">
        {/* Live Preview Bar */}
        <div className="bg-[#181A1D] text-[#F4F4F2] p-6 border border-[#495464]/40 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#495464]/30">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#BBBFCA]/70 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[#BBBFCA]" /> Live Customer Header Preview
            </span>
            <span className="text-[9px] uppercase px-2 py-0.5 bg-[#495464] text-[#F4F4F2] font-mono">
              Real-Time Sync
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 flex items-center justify-between overflow-x-auto">
            <span className="font-serif tracking-[0.3em] text-sm text-[#F4F4F2] mr-8">SHOPY</span>
            <div className="flex items-center gap-6 text-[11px] lowercase tracking-wider text-[#BBBFCA] whitespace-nowrap">
              {items
                .filter((it) => it.isActive)
                .map((it) => (
                  <span
                    key={it.id}
                    className="hover:text-white transition-colors cursor-default"
                  >
                    {it.name}
                  </span>
                ))}
            </div>
            <div className="text-[10px] text-[#BBBFCA]/60 ml-8 whitespace-nowrap">
              [search / account / bag]
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#495464]">Configured Navigation Links</h2>
            <p className="text-xs text-[#495464]/60">
              {items.filter((i) => i.isActive).length} of {items.length} links currently visible on the storefront
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-5 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Navigation Link</span>
          </button>
        </div>

        {/* Table of Navigation Items */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E8E8E8] text-[#495464] border-b border-[#BBBFCA]/40 uppercase tracking-widest text-[10px] font-semibold">
                  <tr>
                    <th className="p-4 w-16 text-center">Order</th>
                    <th className="p-4">Label</th>
                    <th className="p-4">Destination URL</th>
                    <th className="p-4">Category Association</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/30">
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#E8E8E8]/50 transition-colors ${
                        !item.isActive ? "opacity-60 bg-gray-50/50" : ""
                      }`}
                    >
                      {/* Order Controls */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveOrder(idx, "up")}
                            className="p-1 text-[#495464] hover:bg-[#BBBFCA]/30 disabled:opacity-20 transition-colors"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] font-bold w-4 text-center">
                            {idx + 1}
                          </span>
                          <button
                            disabled={idx === items.length - 1}
                            onClick={() => moveOrder(idx, "down")}
                            className="p-1 text-[#495464] hover:bg-[#BBBFCA]/30 disabled:opacity-20 transition-colors"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="p-4 font-medium text-[#495464] lowercase font-mono">
                        {item.name}
                      </td>

                      {/* Destination */}
                      <td className="p-4 font-mono text-[11px] text-[#495464]/80">
                        <Link
                          href={item.href}
                          target="_blank"
                          className="inline-flex items-center gap-1 hover:underline text-[#495464]"
                        >
                          <span>{item.href}</span>
                          <ExternalLink className="w-3 h-3 text-[#495464]/50" />
                        </Link>
                      </td>

                      {/* Category Slug */}
                      <td className="p-4 text-[#495464]/70">
                        {item.categorySlug ? (
                          <span className="px-2 py-0.5 bg-[#BBBFCA]/30 text-[#495464] text-[10px] uppercase font-mono">
                            {item.categorySlug}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#495464]/40 italic">Direct Link</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleVisibility(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-semibold tracking-wider transition-colors ${
                            item.isActive
                              ? "bg-[#E8E8E8] text-[#495464] border border-[#BBBFCA] hover:bg-[#495464] hover:text-[#F4F4F2]"
                              : "bg-[#F4F4F2] text-[#495464]/60 border border-dashed border-[#BBBFCA] hover:bg-[#E8E8E8] hover:text-[#495464]"
                          }`}
                          title={`Click to ${item.isActive ? "hide from" : "show in"} storefront navbar`}
                        >
                          {item.isActive ? (
                            <>
                              <Eye className="w-3 h-3 text-[#495464]" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-[#495464]/60" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                          title="Edit Link"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-1.5 text-[#495464] hover:text-black hover:bg-[#BBBFCA]/40 transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-md bg-[#F4F4F2] text-[#495464] z-10 p-6 space-y-4 shadow-2xl border border-[#BBBFCA]/60">
              <div className="flex justify-between items-center border-b border-[#BBBFCA]/40 pb-3">
                <h3 className="font-serif text-lg font-medium">
                  {editingItem ? `Edit Link: "${editingItem.name}"` : "Add Header Link"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 hover:opacity-70 text-[#495464]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">
                    Display Name * (e.g. "outerwear" or "lookbook")
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="tops, bottoms, new arrivals..."
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">
                    Destination URL * (e.g. "/collections/tops" or "/products")
                  </label>
                  <input
                    type="text"
                    required
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    placeholder="/collections/tops, /products, /editorial..."
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold mb-1">
                      Display Order Index
                    </label>
                    <input
                      type="number"
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(Number(e.target.value))}
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold mb-1">
                      Category Tag (Optional)
                    </label>
                    <input
                      type="text"
                      value={categorySlug}
                      onChange={(e) => setCategorySlug(e.target.value)}
                      placeholder="e.g. outerwear"
                      className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#495464]"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-medium cursor-pointer">
                    Display in Top Storefront Navigation
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#BBBFCA]/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-[#BBBFCA] uppercase text-[10px] font-medium tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#495464] text-[#F4F4F2] px-5 py-2 uppercase text-[10px] font-medium tracking-widest hover:bg-[#363E4B] transition-colors"
                  >
                    {saving ? "Saving..." : editingItem ? "Update Link" : "Create Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Custom Luxury Delete Navigation Item Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Remove Navigation Link"
          description={`Are you sure you want to remove "${deletingNav?.name}" from the header navigation?`}
          entityName={deletingNav?.name}
          secondaryNote="This will remove the link from the storefront header bar. The underlying category or product page will remain fully accessible."
          confirmLabel="Remove Link"
          cancelLabel="Cancel"
          isDanger={true}
          isLoading={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteModalOpen(false);
              setDeletingNav(null);
              setDeleteError(null);
            }
          }}
        />
      </main>
    </div>
  );
}
