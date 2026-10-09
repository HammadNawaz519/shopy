"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Loader2,
  X,
  Check,
  Tag,
  AlertCircle,
  UploadCloud,
  Sparkles,
  ImageIcon,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [generatingColorHex, setGeneratingColorHex] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string; image?: string | null } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    categoryLabel: "",
    price: "",
    originalPrice: "",
    stockCount: "15",
    description: "",
    images: [] as string[],
    colors: [] as { name: string; hex: string; imageUrl?: string }[],
    sizesEnabled: false,
    sizes: [] as string[],
    tag: "NEW",
    featured: false,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    let successCount = 0;

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData,
        });

        const data = await res.json();
        if (res.ok && data.success && data.url) {
          uploadedUrls.push(data.url);
          successCount++;
        } else {
          showToast(data.error || `Failed to upload ${file.name}.`, "error");
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => {
          const newImages = [...prev.images, ...uploadedUrls];
          // Intelligently auto-link unlinked colors to new images in sequence
          const updatedColors = prev.colors.map((c, i) => {
            if (!c.imageUrl && newImages[i]) {
              return { ...c, imageUrl: newImages[i] };
            }
            return c;
          });
          return {
            ...prev,
            images: newImages,
            colors: updatedColors,
          };
        });
      }

      if (successCount > 0) {
        showToast(
          successCount === 1
            ? "Product photo compressed & appended."
            : `${successCount} photos compressed & appended.`,
          "success"
        );
      }
    } catch {
      showToast("Network error uploading image(s).", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      const newImages = [...prev.images, trimmed];
      const updatedColors = prev.colors.map((c, i) => {
        if (!c.imageUrl && newImages[i]) {
          return { ...c, imageUrl: newImages[i] };
        }
        return c;
      });
      return {
        ...prev,
        images: newImages,
        colors: updatedColors,
      };
    });
    setCustomUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    const removedUrl = formData.images[index];
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      colors: prev.colors.map((c) => (c.imageUrl === removedUrl ? { ...c, imageUrl: "" } : c)),
    }));
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    setFormData((prev) => {
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const updated = [...prev.images];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, images: updated };
    });
  };

  const handleAssignColorToImage = (colorName: string, imgUrl: string) => {
    setFormData((prev) => {
      if (!colorName) {
        return {
          ...prev,
          colors: prev.colors.map((c) => (c.imageUrl === imgUrl ? { ...c, imageUrl: "" } : c)),
        };
      }
      return {
        ...prev,
        colors: prev.colors.map((c) => {
          if (c.name === colorName) {
            return { ...c, imageUrl: imgUrl };
          }
          return c;
        }),
      };
    });
  };

  const handleAddColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          name: `Variant ${prev.colors.length + 1}`,
          hex: prev.colors.length === 0 ? "#F4F4F2" : prev.colors.length === 1 ? "#222831" : "#8E8D8A",
          imageUrl: prev.images[prev.colors.length] || "",
        },
      ],
    }));
  };

  const handleUpdateColor = (index: number, field: "name" | "hex" | "imageUrl", value: string) => {
    setFormData((prev) => {
      const updated = [...prev.colors];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, colors: updated };
    });
  };

  const handleSuggestColorHex = async (index: number) => {
    const colorName = formData.colors[index]?.name.trim();
    if (!colorName) {
      showToast("Enter a color name first.", "error");
      return;
    }

    setGeneratingColorHex(index);
    try {
      const res = await fetch("/api/admin/color-hex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.hex !== "string") {
        showToast(data.error || "Could not generate a color hex.", "error");
        return;
      }
      handleUpdateColor(index, "hex", data.hex);
      showToast(`Suggested hex ${data.hex} for ${colorName}.`, "success");
    } catch {
      showToast("Network error generating color hex.", "error");
    } finally {
      setGeneratingColorHex(null);
    }
  };

  const handleRemoveColor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const [categories, setCategories] = useState<any[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      showToast("Failed to load products.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // Categories are static lookup data — fetch only once on mount
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: categories.length > 0 ? categories[0].slug : "",
      categoryLabel: categories.length > 0 ? categories[0].name : "",
      price: "",
      originalPrice: "",
      stockCount: "15",
      description: "",
      images: [],
      colors: [
        { name: "Light", hex: "#E8E8E8", imageUrl: "" },
        { name: "Dark", hex: "#222831", imageUrl: "" },
      ],
      sizesEnabled: false,
      sizes: [],
      tag: "NEW",
      featured: false,
    });
    setCustomUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    const existingColors = Array.isArray(prod.colors) && prod.colors.length > 0
      ? prod.colors.map((c: any) => {
          if (typeof c === "string") return { name: c, hex: "#495464", imageUrl: "" };
          return {
            name: c.name || "Default",
            hex: c.hex || "#495464",
            imageUrl: c.imageUrl || "",
          };
        })
      : [
          { name: "Light", hex: "#E8E8E8", imageUrl: "" },
          { name: "Dark", hex: "#222831", imageUrl: "" },
        ];

    setFormData({
      name: prod.name,
      category: prod.category,
      categoryLabel: prod.categoryLabel,
      price: String(prod.price),
      originalPrice: prod.originalPrice ? String(prod.originalPrice) : "",
      stockCount: String(prod.stockCount),
      description: prod.description || "",
      images: Array.isArray(prod.images) ? [...prod.images] : [],
      colors: existingColors,
      sizesEnabled: Array.isArray(prod.sizes) && prod.sizes.length > 0,
      sizes: Array.isArray(prod.sizes) ? [...prod.sizes] : [],
      tag: prod.tag || "NEW",
      featured: Boolean(prod.featured),
    });
    setCustomUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showToast("Please fill in required fields.", "error");
      return;
    }

    if (uploadingImage) {
      showToast("Please wait for image compression to complete.", "error");
      return;
    }

    setSaving(true);
    try {
      const matchedCat = categories.find((c) => c.slug === formData.category || c.id === formData.category);
      const catLabel = matchedCat ? matchedCat.name : (formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : "General");
      const validImages = formData.images.filter(Boolean);
      const productImages = validImages.length > 0 ? validImages : ["/editorial-craft.jpg"];
      const validColors = formData.colors
        .filter((c) => c.name && c.name.trim().length > 0)
        .map((c) => ({
          name: c.name.trim(),
          hex: c.hex || "#495464",
          imageUrl: c.imageUrl || undefined,
        }));

      if (editingProduct) {
        // Edit existing product
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: formData.name.trim(),
            category: formData.category,
            categoryLabel: catLabel,
            price: Number(formData.price),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
            stockCount: Number(formData.stockCount || 0),
            description: formData.description.trim(),
            images: productImages,
            colors: validColors,
            sizes: formData.sizesEnabled ? formData.sizes.filter(Boolean) : [],
            tag: formData.tag,
            featured: formData.featured,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Product updated successfully in DB.", "success");
          setModalOpen(false);
          fetchProducts();
        } else {
          showToast(data.error || "Failed to update product.", "error");
        }
      } else {
        // Add new product
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            category: formData.category,
            categoryLabel: catLabel,
            price: Number(formData.price),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
            stockCount: Number(formData.stockCount || 0),
            description: formData.description.trim(),
            images: productImages,
            colors: validColors,
            sizes: formData.sizesEnabled ? formData.sizes.filter(Boolean) : [],
            tag: formData.tag,
            featured: formData.featured,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Product created successfully in DB.", "success");
          setModalOpen(false);
          fetchProducts();
        } else {
          showToast(data.error || "Failed to create product.", "error");
        }
      }
    } catch {
      showToast("Network error saving product.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (product: any) => {
    setDeletingProduct({
      id: product.id,
      name: product.name,
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
    });
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(deletingProduct.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setDeleteModalOpen(false);
        setDeletingProduct(null);
        if (data.archived) {
          showToast(data.message || "Product was safely archived to preserve customer order history.", "info");
        } else {
          showToast("✓ Product deleted from catalog.", "success");
        }
        fetchProducts();
      } else {
        const safeError =
          typeof data.error === "string"
            ? data.error
            : "We couldn't delete this product right now. Please try again.";
        setDeleteError(safeError);
      }
    } catch {
      setDeleteError("A network error occurred while contacting the server. Please check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async (prod: any) => {
    try {
      const updatedFeatured = !prod.featured;
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prod.id, featured: updatedFeatured }),
      });
      if (res.ok) {
        showToast(`Product ${updatedFeatured ? "marked as featured" : "unfeatured"}`, "success");
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, featured: updatedFeatured } : p))
        );
      }
    } catch {
      showToast("Error updating featured status.", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Product Catalog"
        subtitle="Manage Silhouette Inventory, Pricing & Media"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
        {/* Controls Bar */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#495464]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search silhouettes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#E8E8E8] border border-[#BBBFCA] pl-9 pr-3 py-2 text-xs text-[#495464] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-[#495464] text-[#F4F4F2] px-3 py-2 text-xs uppercase tracking-wider hover:bg-[#363E4B]"
              >
                Search
              </button>
            </form>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#E8E8E8] border border-[#BBBFCA] px-3 py-2 text-xs uppercase tracking-wider font-medium text-[#495464] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-4 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#495464]/60 uppercase tracking-widest">
              No products found in catalogue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tracking-wider">
                <thead className="bg-[#E8E8E8]/70 border-b border-[#BBBFCA]/40 text-[#495464] uppercase text-[10px]">
                  <tr>
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Stock</th>
                    <th className="p-4 font-semibold">Tag</th>
                    <th className="p-4 font-semibold text-center">Featured</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-[#E8E8E8] flex-shrink-0 overflow-hidden border border-[#BBBFCA]/30">
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-sm font-medium text-[#495464] truncate max-w-xs">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-[#495464]/60">SKU: {p.id}</p>
                          {Array.isArray(p.colors) && p.colors.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {p.colors.map((c: any, cIdx: number) => (
                                <span
                                  key={cIdx}
                                  title={`${c.name || "Color"}${c.imageUrl ? " (Linked to photo)" : ""}`}
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block"
                                  style={{ backgroundColor: c.hex || "#495464" }}
                                />
                              ))}
                              <span className="text-[9px] text-[#495464]/60 ml-0.5 font-mono">
                                {p.colors.length} {p.colors.length === 1 ? "color" : "colors"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 uppercase text-[10px] font-semibold text-[#495464]/80">
                        {p.categoryLabel}
                      </td>
                      <td className="p-4 font-serif font-semibold text-[#495464]">
                        {formatPrice(p.price)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider ${
                            p.stockCount > 5
                              ? "bg-emerald-100 text-emerald-800"
                              : p.stockCount > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.stockCount} in stock
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-[#E8E8E8] text-[#495464] text-[9px] font-semibold tracking-wider uppercase">
                          {p.tag || "REGULAR"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          className={`p-1.5 transition-colors ${
                            p.featured ? "text-amber-500" : "text-[#BBBFCA] hover:text-[#495464]"
                          }`}
                          title="Toggle Featured"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-[#495464] hover:bg-[#E8E8E8] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(p)}
                          className="p-1.5 text-[#495464] hover:text-black hover:bg-[#BBBFCA]/40 transition-colors"
                          title="Delete"
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

        {/* Add / Edit Product Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setModalOpen(false)}
            />
            <div className="relative w-full max-w-2xl bg-[#F4F4F2] text-[#495464] z-10 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-[#BBBFCA]/40 pb-3">
                <h3 className="font-serif text-xl font-medium text-[#495464]">
                  {editingProduct ? "Edit Product Silhouette" : "Add New Silhouette"}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:opacity-70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
                {/* 1. Product Title */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Architectural Linen Overshirt"
                    className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464] transition-colors"
                  />
                </div>

                {/* 2. Category & Tag Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={categories.length === 0}
                      className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] uppercase focus:outline-none focus:border-[#495464] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {categories.length > 0 ? (
                        categories.map((c) => (
                          <option key={c.id || c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No collections available</option>
                      )}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        No collections found. Please add a collection in the Collections tab first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1.5">
                      Tag / Badge
                    </label>
                    <select
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] uppercase focus:outline-none focus:border-[#495464] transition-colors"
                    >
                      <option value="NEW">NEW</option>
                      <option value="SALE">SALE</option>
                      <option value="LIMITED">LIMITED</option>
                      <option value="ARCHIVE">ARCHIVE</option>
                    </select>
                  </div>
                </div>

                {/* 3. Price, Original Price, Stock Count (Aligned on exact same baseline) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="h-6 flex items-end text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1.5">
                      Price (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="8500"
                      className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="h-6 flex items-end text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1.5">
                      Original Price (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="10500"
                      className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="h-6 flex items-end text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1.5">
                      Stock Count *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stockCount}
                      onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                      className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464] transition-colors"
                    />
                  </div>
                </div>

                {/* 4. Optional Size Selection */}
                <div className="border border-[#BBBFCA]/50 p-3.5 space-y-3">
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <span className="text-[10px] uppercase tracking-widest font-semibold">
                      Show Size Selection
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.sizesEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, sizesEnabled: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#495464]"
                    />
                  </label>
                  {formData.sizesEnabled && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5">
                        Sizes
                      </label>
                      <input
                        type="text"
                        value={formData.sizes.join(", ")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sizes: e.target.value
                              .split(",")
                              .map((size) => size.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="S, M, L, XL"
                        className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464] transition-colors"
                      />
                      <p className="text-[10px] text-[#495464]/60 mt-1">
                        Separate each size with a comma.
                      </p>
                    </div>
                  )}
                </div>

                {/* 5. Product Image Upload with Sharp processing & Multi-Image Gallery Manager */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464]">
                      Product Photography ({formData.images.length} {formData.images.length === 1 ? "Image" : "Images"}) *
                    </label>
                    <span className="text-[9px] uppercase tracking-wider text-[#495464]/60 font-mono">
                      First Image is Primary / Storefront Cover
                    </span>
                  </div>

                  {/* Hidden Multi-File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/png, image/jpeg, image/webp, image/avif, image/jpg"
                    className="hidden"
                  />

                  {/* Upload Controls & URL input */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#495464] text-[#F4F4F2] px-3.5 py-2 text-[10px] uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors flex-shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      <span>{uploadingImage ? "Optimizing..." : "Upload from Computer"}</span>
                    </button>
                    
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomUrl();
                          }
                        }}
                        placeholder="Or paste image URL and press Add..."
                        className="flex-1 bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono text-[#495464] focus:outline-none focus:border-[#495464]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomUrl()}
                        disabled={!customUrlInput.trim()}
                        className="px-3 py-2 bg-[#BBBFCA]/50 hover:bg-[#BBBFCA] text-[#495464] text-[10px] uppercase tracking-wider font-semibold transition-colors disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Multi-Image List with Primary Tag, Color Assignment, Reordering, and Removal */}
                  {formData.images.length > 0 && (
                    <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
                      {formData.images.map((imgUrl, idx) => {
                        const assignedColors = formData.colors.filter((c) => c.imageUrl === imgUrl);
                        const primaryAssignedColor = assignedColors[0]?.name || "";

                        return (
                          <div
                            key={`${imgUrl}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#E8E8E8] border border-[#BBBFCA] shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-12 h-12 bg-[#BBBFCA]/40 flex-shrink-0 overflow-hidden border border-[#BBBFCA]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgUrl}
                                  alt={`Product Photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                  {idx === 0 ? (
                                    <span className="bg-[#495464] text-[#F4F4F2] text-[8px] uppercase tracking-widest font-semibold px-1.5 py-0.5">
                                      Primary / Cover
                                    </span>
                                  ) : (
                                    <span className="text-[9px] uppercase tracking-wider text-[#495464]/60 font-semibold font-mono">
                                      Photo #{idx + 1}
                                    </span>
                                  )}

                                  {/* Assigned Color Badges */}
                                  {assignedColors.map((ac) => (
                                    <span
                                      key={ac.name}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#BBBFCA]/50 text-[8px] uppercase tracking-wider font-semibold text-[#495464] border border-[#BBBFCA]"
                                    >
                                      <span
                                        className="w-2 h-2 rounded-full border border-black/20"
                                        style={{ backgroundColor: ac.hex }}
                                      />
                                      {ac.name}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-[10px] text-[#495464]/70 truncate font-mono max-w-[180px] sm:max-w-[220px]">
                                  {imgUrl}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                              {/* Direct Color Assignment Dropdown */}
                              {formData.colors.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] uppercase tracking-wider text-[#495464]/70 font-semibold whitespace-nowrap">
                                    Assign:
                                  </span>
                                  <select
                                    value={primaryAssignedColor}
                                    onChange={(e) => handleAssignColorToImage(e.target.value, imgUrl)}
                                    className="h-7 bg-[#F4F4F2] border border-[#BBBFCA] px-1.5 text-[10px] text-[#495464] uppercase font-medium focus:outline-none focus:border-[#495464]"
                                  >
                                    <option value="">(None / General)</option>
                                    {formData.colors.map((c) => (
                                      <option key={c.name} value={c.name}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Move Left / Up */}
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveImage(idx, "left")}
                                  title="Move left (make primary)"
                                  className="p-1.5 text-[#495464] hover:bg-[#BBBFCA]/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                {/* Move Right / Down */}
                                <button
                                  type="button"
                                  disabled={idx === formData.images.length - 1}
                                  onClick={() => handleMoveImage(idx, "right")}
                                  title="Move right"
                                  className="p-1.5 text-[#495464] hover:bg-[#BBBFCA]/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                {/* Delete specific image */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="text-[10px] uppercase tracking-wider text-[#495464] hover:text-black px-2.5 py-1 bg-[#BBBFCA]/40 hover:bg-[#BBBFCA]/70 transition-colors font-medium ml-1 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Color Swatches & Photo Assignment */}
                <div className="space-y-2 pt-2 border-t border-[#BBBFCA]/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464]">
                        Color Swatches & Image Assignment ({formData.colors.length} {formData.colors.length === 1 ? "Variant" : "Variants"})
                      </label>
                      <span className="text-[9px] uppercase tracking-wider text-[#495464]/60 font-mono">
                        Assign which photo displays when customer clicks each color
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[#495464] hover:text-black px-2.5 py-1 bg-[#BBBFCA]/40 hover:bg-[#BBBFCA]/70 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Color</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.colors.map((col, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 bg-[#E8E8E8] border border-[#BBBFCA]"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* Hex Color Picker */}
                          <input
                            type="color"
                            value={col.hex && col.hex.startsWith("#") && col.hex.length === 7 ? col.hex : "#495464"}
                            onChange={(e) => handleUpdateColor(cIdx, "hex", e.target.value)}
                            className="w-7 h-7 p-0 border border-[#BBBFCA] rounded-none cursor-pointer bg-transparent flex-shrink-0"
                            title="Pick swatch hex color"
                          />

                          {/* Color Name */}
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => handleUpdateColor(cIdx, "name", e.target.value)}
                            placeholder="Color Name (e.g. Light or Dark)"
                            className="h-8 flex-1 bg-[#F4F4F2] border border-[#BBBFCA] px-2.5 text-xs text-[#495464] focus:outline-none focus:border-[#495464]"
                          />

                          {/* Hex String */}
                          <input
                            type="text"
                            value={col.hex}
                            onChange={(e) => handleUpdateColor(cIdx, "hex", e.target.value)}
                            placeholder="#495464"
                            className="h-8 w-20 bg-[#F4F4F2] border border-[#BBBFCA] px-2 text-[10px] font-mono text-[#495464] uppercase focus:outline-none focus:border-[#495464]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSuggestColorHex(cIdx)}
                            disabled={generatingColorHex === cIdx}
                            className="h-8 px-2 bg-[#BBBFCA]/40 hover:bg-[#BBBFCA]/70 text-[9px] uppercase tracking-wider font-semibold disabled:opacity-50 whitespace-nowrap"
                          >
                            {generatingColorHex === cIdx ? "Suggesting..." : "Suggest Hex"}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 justify-between sm:justify-end">
                          <span className="text-[9px] uppercase tracking-wider text-[#495464]/70 font-semibold whitespace-nowrap">
                            Assigned Photo:
                          </span>
                          <select
                            value={col.imageUrl || ""}
                            onChange={(e) => handleUpdateColor(cIdx, "imageUrl", e.target.value)}
                            className="h-8 bg-[#F4F4F2] border border-[#BBBFCA] px-2 text-[10px] text-[#495464] font-medium focus:outline-none focus:border-[#495464] max-w-[160px] sm:max-w-[200px]"
                          >
                            <option value="">None (Uses Primary Photo)</option>
                            {formData.images.map((img, imgIdx) => (
                              <option key={`${img}-${imgIdx}`} value={img}>
                                Photo #{imgIdx + 1} {imgIdx === 0 ? "(Cover)" : ""}
                              </option>
                            ))}
                          </select>

                          {col.imageUrl && (
                            <div className="relative w-8 h-8 bg-[#BBBFCA]/40 flex-shrink-0 border border-[#BBBFCA] overflow-hidden" title="Assigned Photo Preview">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={col.imageUrl}
                                alt={col.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {formData.colors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(cIdx)}
                              className="p-1.5 text-[#495464] hover:text-red-700 hover:bg-[#BBBFCA]/40 transition-colors cursor-pointer"
                              title="Remove color variant"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Description */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Editorial product composition and craftsmanship notes..."
                    className="w-full bg-[#E8E8E8] border border-[#BBBFCA] p-3 text-xs text-[#495464] focus:outline-none focus:border-[#495464] transition-colors"
                  />
                </div>

                {/* 6. Feature on Homepage */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="featuredCheckbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 accent-[#495464] cursor-pointer"
                  />
                  <label htmlFor="featuredCheckbox" className="text-xs uppercase tracking-wider font-semibold text-[#495464] cursor-pointer">
                    Feature on Homepage Carousel
                  </label>
                </div>

                {/* 7. Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#BBBFCA]/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="h-10 px-5 border border-[#BBBFCA] text-xs uppercase tracking-wider font-medium hover:bg-[#E8E8E8] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 bg-[#495464] text-[#F4F4F2] px-6 text-xs uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save Product to DB"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Custom Luxury Delete Product Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete Product Silhouette"
          description="Are you sure you want to permanently delete this product? This action cannot be undone."
          entityName={deletingProduct?.name}
          entityImage={deletingProduct?.image}
          secondaryNote="This will permanently remove the silhouette, variants, and owned media assets from the active catalog. Historical customer order invoices will remain safely preserved."
          confirmLabel="Delete Product"
          cancelLabel="Cancel"
          isDanger={true}
          isLoading={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteModalOpen(false);
              setDeletingProduct(null);
              setDeleteError(null);
            }
          }}
        />
      </main>
    </div>
  );
}
