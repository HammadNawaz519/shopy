"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Loader2,
  X,
  ExternalLink,
  FileText,
  Save,
  Sparkles,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useToast } from "@/context/ToastContext";

interface PageItem {
  id: string;
  slug: string;
  name: string;
  body: string;
  orderIndex: number;
  isActive: boolean;
  assignedCount?: number;
}

export default function AdminPagesPage() {
  const { showToast } = useToast();

  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Collections section title (shared: /collections header + homepage grid)
  const [collectionsTitle, setCollectionsTitle] = useState("Collections");
  const [savingTitle, setSavingTitle] = useState(false);

  // Add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Reordering
  const [moving, setMoving] = useState(false);

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPage, setDeletingPage] = useState<PageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const [pagesRes, homeRes] = await Promise.all([
        fetch("/api/admin/pages"),
        fetch("/api/admin/homepage"),
      ]);
      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setPages(data.pages || []);
      }
      if (homeRes.ok) {
        const data = await homeRes.json();
        setCollectionsTitle(data.config?.collectionsTitle?.trim() || "Collections");
      }
    } catch {
      showToast("Failed to load pages.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // ---------------------------------------------------------------- Title
  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingTitle) return;
    setSavingTitle(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionsTitle: collectionsTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Collections section title published live.", "success");
        fetchPages();
      } else {
        showToast(data.error || "Failed to update collections title.", "error");
      }
    } catch {
      showToast("Network error saving collections title.", "error");
    } finally {
      setSavingTitle(false);
    }
  };

  // ---------------------------------------------------------------- Modal
  const openAddModal = () => {
    setEditingPage(null);
    setName("");
    setBody("");
    setModalOpen(true);
  };

  const openEditModal = (page: PageItem) => {
    setEditingPage(page);
    setName(page.name);
    setBody(page.body || "");
    setModalOpen(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: editingPage ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingPage
            ? { id: editingPage.id, name: name.trim(), body: body.trim() }
            : { name: name.trim(), body: body.trim() }
        ),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        showToast(editingPage ? "Page updated successfully." : "New page published.", "success");
        setModalOpen(false);
        fetchPages();
      } else {
        showToast(data.error || "Failed to save page.", "error");
      }
    } catch {
      showToast("Network error saving page.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------- Order
  const moveOrder = async (index: number, direction: "up" | "down") => {
    if (moving) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    setMoving(true);
    try {
      const reordered = [...pages];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);

      // Send the COMPLETE id list — the server verifies it is a full permutation.
      const res = await fetch("/api/admin/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: reordered.map((p) => p.id) }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        showToast("Page order updated.", "success");
        fetchPages();
      } else {
        showToast(data.error || "Failed to update page order.", "error");
      }
    } catch {
      showToast("Network error updating page order.", "error");
    } finally {
      setMoving(false);
    }
  };

  // ------------------------------------------------------------- Visibility
  const toggleVisibility = async (page: PageItem) => {
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: page.id, isActive: !page.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        showToast(
          page.isActive
            ? `"${page.name}" is hidden. It no longer shows on the homepage, its /pages link 404s, and its collections temporarily link to their collection pages.`
            : `"${page.name}" is live again — its homepage section and /pages link are restored.`,
          "success"
        );
        fetchPages();
      } else {
        showToast(data.error || "Failed to toggle page visibility.", "error");
      }
    } catch {
      showToast("Network error toggling page visibility.", "error");
    }
  };

  // --------------------------------------------------------------- Delete
  const handleOpenDeleteModal = (page: PageItem) => {
    setDeletingPage(page);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPage || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/pages?id=${encodeURIComponent(deletingPage.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setDeleteModalOpen(false);
        setDeletingPage(null);
        showToast(`✓ Page "${deletingPage.name}" removed.`, "success");
        fetchPages();
      } else {
        setDeleteError(
          typeof data.error === "string"
            ? data.error
            : "We couldn't remove this page right now. Please try again."
        );
      }
    } catch {
      setDeleteError("A network error occurred while contacting the server. Please check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F4F2]">
      <AdminHeader
        title="Store Pages & Collections Title"
        subtitle="Custom Landing Pages Below the Hero, Collection Link Targets & Editable Collections Heading"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-8">
        {/* Collections Section Title */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#BBBFCA]/30">
            <FileText className="w-4 h-4 text-[#495464]" />
            <h3 className="font-serif text-lg font-medium text-[#495464]">Collections Section Title</h3>
          </div>
          <p className="text-xs text-[#495464]/60">
            This title appears on the <span className="font-mono">/collections</span> page header and the homepage
            collection grid. Type anything you want — it publishes live for all customers.
          </p>
          <form onSubmit={handleSaveTitle} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={collectionsTitle}
              maxLength={100}
              onChange={(e) => setCollectionsTitle(e.target.value)}
              placeholder="Collections"
              className="flex-1 bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs font-serif"
            />
            <button
              type="submit"
              disabled={savingTitle}
              className="inline-flex items-center justify-center gap-2 bg-[#495464] text-[#F4F4F2] px-6 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {savingTitle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{savingTitle ? "Publishing..." : "Save Title"}</span>
            </button>
          </form>
        </div>

        {/* Pages Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#495464]">Store Landing Pages</h2>
            <p className="text-xs text-[#495464]/60">
              {pages.filter((p) => p.isActive).length} of {pages.length} pages live on the storefront
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-5 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Page</span>
          </button>
        </div>

        {/* Pages List */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 shadow-xs">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
            </div>
          ) : pages.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-3">
              <Sparkles className="w-6 h-6 text-[#495464]/50 mx-auto" />
              <h2 className="font-serif text-xl text-[#495464]">No Store Pages Yet</h2>
              <p className="text-xs text-[#495464]/60 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                Create a custom landing page below the homepage hero — with its own heading, content, and assigned
                collections.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#BBBFCA]/30">
              {pages.map((page, idx) => (
                <div
                  key={page.id}
                  className={`p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center gap-3 transition-colors ${
                    !page.isActive ? "opacity-60" : ""
                  }`}
                >
                  {/* Order controls */}
                  <div className="flex items-center gap-1 lg:w-14 flex-shrink-0">
                    <button
                      disabled={idx === 0 || moving}
                      onClick={() => moveOrder(idx, "up")}
                      className="p-1 text-[#495464] hover:bg-[#BBBFCA]/30 disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] font-bold w-5 text-center">{idx + 1}</span>
                    <button
                      disabled={idx === pages.length - 1 || moving}
                      onClick={() => moveOrder(idx, "down")}
                      className="p-1 text-[#495464] hover:bg-[#BBBFCA]/30 disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-base font-medium text-[#495464]">{page.name}</span>
                      <span className="font-mono text-[10px] text-[#495464]/60">/pages/{page.slug}</span>
                      {(page.assignedCount ?? 0) > 0 && (
                        <span className="px-2 py-0.5 bg-[#BBBFCA]/30 text-[#495464] text-[10px] uppercase font-semibold">
                          {page.assignedCount} {page.assignedCount === 1 ? "Collection" : "Collections"}
                        </span>
                      )}
                    </div>
                    {page.body && (
                      <p className="text-[11px] text-[#495464]/60 line-clamp-1 mt-1">{page.body}</p>
                    )}
                  </div>

                  {/* Status toggle */}
                  <button
                    onClick={() => toggleVisibility(page)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-semibold tracking-wider transition-colors flex-shrink-0 ${
                      page.isActive
                        ? "bg-[#E8E8E8] text-[#495464] border border-[#BBBFCA] hover:bg-[#495464] hover:text-[#F4F4F2]"
                        : "bg-[#F4F4F2] text-[#495464]/60 border border-dashed border-[#BBBFCA] hover:bg-[#E8E8E8] hover:text-[#495464]"
                    }`}
                    title={`Click to ${page.isActive ? "hide from" : "show on"} the storefront`}
                  >
                    {page.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{page.isActive ? "Live" : "Hidden"}</span>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(page)}
                      className="p-1.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                      title="Edit Page"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/pages/${page.slug}`}
                      target="_blank"
                      className="p-1.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                      title="Preview Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleOpenDeleteModal(page)}
                      className="p-1.5 text-[#495464] hover:text-black hover:bg-[#BBBFCA]/40 transition-colors"
                      title="Delete Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-md bg-[#F4F4F2] text-[#495464] z-10 p-6 space-y-4 shadow-2xl border border-[#BBBFCA]/60 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-[#BBBFCA]/40 pb-3">
                <h3 className="font-serif text-lg font-medium">
                  {editingPage ? `Edit Page: "${editingPage.name}"` : "Add Store Page"}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:opacity-70 text-[#495464]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePage} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">
                    Page Heading * <span className="normal-case text-[#495464]/60">(large premium title)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    maxLength={100}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer, Atelier, The Archive..."
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-sm font-serif"
                  />
                  <p className="mt-1 text-[9px] text-[#495464]/60">
                    {editingPage
                      ? "Renaming never changes the page URL (/pages/ stays stable)."
                      : "The URL /pages/ is generated once from this name and stays stable."}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] uppercase font-semibold">Page Content (optional)</label>
                    <span className="text-[9px] font-mono text-[#495464]/60">{body.length}/2000</span>
                  </div>
                  <textarea
                    rows={4}
                    value={body}
                    maxLength={2000}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write anything you want — a short story, a season note..."
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2.5 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#BBBFCA]/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-[#BBBFCA] uppercase text-[10px] font-medium tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="bg-[#495464] text-[#F4F4F2] px-5 py-2 uppercase text-[10px] font-medium tracking-widest hover:bg-[#363E4B] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingPage ? "Update Page" : "Create Page"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete Store Page"
          description={`Are you sure you want to permanently delete "${deletingPage?.name}"?`}
          entityName={deletingPage?.name}
          secondaryNote={
            (deletingPage?.assignedCount ?? 0) > 0
              ? `${deletingPage!.assignedCount} collection${deletingPage!.assignedCount === 1 ? "" : "s"} assigned to this page will revert to their standard collection URLs.`
              : "This page will be removed from the homepage and its /pages link will stop working."
          }
          confirmLabel="Delete Page"
          cancelLabel="Cancel"
          isDanger={true}
          isLoading={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteModalOpen(false);
              setDeletingPage(null);
              setDeleteError(null);
            }
          }}
        />
      </main>
    </div>
  );
}
