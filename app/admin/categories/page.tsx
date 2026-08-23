"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, FolderTree, Loader2, X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/context/ToastContext";

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      showToast("Failed to load categories.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, image }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Category added successfully.", "success");
        setModalOpen(false);
        setName("");
        setDescription("");
        setImage("");
        fetchCategories();
      } else {
        showToast(data.error || "Failed to create category.", "error");
      }
    } catch {
      showToast("Network error creating category.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Category Architecture"
        subtitle="Organize Editorial Lookbooks & Collections"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
        <div className="flex justify-between items-center bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#495464]">Active Collections</h2>
            <p className="text-xs text-[#495464]/60">{categories.length} total categories indexed</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-4 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-[#F4F4F2] border border-[#BBBFCA]/40 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="relative h-44 w-full bg-[#E8E8E8]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="font-serif text-xl font-medium tracking-wide">{cat.name}</span>
                    <p className="text-[10px] text-white/80 uppercase tracking-widest">
                      {cat.productCount || 0} Pieces in DB
                    </p>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between border-t border-[#BBBFCA]/30 text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-[#495464]/60 font-mono">
                    /{cat.slug}
                  </span>
                  <span className="px-2 py-0.5 bg-[#E8E8E8] text-[#495464] text-[9px] uppercase font-semibold">
                    Published
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-md bg-[#F4F4F2] text-[#495464] z-10 p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-[#BBBFCA]/40 pb-2">
                <h3 className="font-serif text-lg font-medium">Add Category</h3>
                <button onClick={() => setModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Outerwear"
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">Image URL</label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
