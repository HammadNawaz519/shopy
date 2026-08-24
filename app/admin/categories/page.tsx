"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  FolderTree,
  Loader2,
  X,
  Edit2,
  Trash2,
  Upload,
  Star,
  ExternalLink,
  Layers,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useToast } from "@/context/ToastContext";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  image: string;
  description?: string;
  featured?: boolean;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const openAddModal = () => {
    setEditingCat(null);
    setName("");
    setTagline("");
    setDescription("");
    setImage("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800");
    setFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCat(cat);
    setName(cat.name);
    setTagline(cat.tagline || "");
    setDescription(cat.description || "");
    setImage(cat.image);
    setFeatured(Boolean(cat.featured));
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setImage(data.url);
        showToast("Category image optimized and ready.", "success");
      } else {
        showToast(data.error || "Image upload failed.", "error");
      }
    } catch {
      showToast("Network error during image upload.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingCat) {
        // Update
        const res = await fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCat.id,
            name: name.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            image: image.trim(),
            featured,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Category updated successfully.", "success");
          setModalOpen(false);
          fetchCategories();
        } else {
          showToast(data.error || "Failed to update category.", "error");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            image: image.trim(),
            featured,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Category created and indexed.", "success");
          setModalOpen(false);
          fetchCategories();
        } else {
          showToast(data.error || "Failed to create category.", "error");
        }
      }
    } catch {
      showToast("Network error saving category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      alert(
        `Cannot delete "${name}": There are ${productCount} products currently assigned to this category. Please reassign or delete these products first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Category "${name}" deleted.`, "success");
        fetchCategories();
      } else {
        showToast(data.error || "Failed to delete category.", "error");
      }
    } catch {
      showToast("Network error deleting category.", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Category & Collection Architecture"
        subtitle="Organize Lookbooks, Collections, and Category Hierarchy"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#495464]">Active Store Collections</h2>
            <p className="text-xs text-[#495464]/60">
              {categories.length} total collections configured in PostgreSQL
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-5 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
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
                className="bg-[#F4F4F2] border border-[#BBBFCA]/40 overflow-hidden shadow-xs flex flex-col justify-between group"
              >
                <div className="relative h-48 w-full bg-[#E8E8E8]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="400px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  
                  {cat.featured && (
                    <div className="absolute top-3 left-3 bg-amber-400 text-black px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3 fill-black" />
                      <span>Featured</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="font-serif text-xl font-medium tracking-wide block">{cat.name}</span>
                    <p className="text-[10px] text-white/80 uppercase tracking-widest flex items-center justify-between mt-1">
                      <span>{cat.productCount || 0} Pieces Assigned</span>
                      <span className="font-mono opacity-60">/{cat.slug}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3 bg-[#F4F4F2]">
                  {cat.tagline && (
                    <p className="text-[11px] text-[#495464]/80 italic line-clamp-1">
                      "{cat.tagline}"
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between border-t border-[#BBBFCA]/30 pt-3 text-xs">
                    <span className="px-2 py-0.5 bg-[#BBBFCA]/30 text-[#495464] text-[9px] uppercase font-semibold">
                      Published
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name, cat.productCount)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-[#F4F4F2] text-[#495464] z-10 p-6 space-y-4 shadow-2xl border border-[#BBBFCA]/60">
              <div className="flex justify-between items-center border-b border-[#BBBFCA]/40 pb-3">
                <h3 className="font-serif text-lg font-medium">
                  {editingCat ? `Edit Category: "${editingCat.name}"` : "Add New Category"}
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
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Outerwear, Footwear, Tailoring"
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Heavyweight tailored silhouettes"
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs"
                  />
                </div>

                {/* Image Upload & Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-semibold mb-1">
                    Category Cover Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 bg-[#181A1D] text-[#F4F4F2] px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors"
                    >
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      <span>{uploading ? "Sharpening..." : "Upload File"}</span>
                    </button>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="flex-1 bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary of this collection..."
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="featuredCatCheck"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#495464]"
                  />
                  <label htmlFor="featuredCatCheck" className="text-xs font-medium cursor-pointer">
                    Feature on Homepage Grid
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
                    {saving ? "Saving..." : editingCat ? "Update Category" : "Create Category"}
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
