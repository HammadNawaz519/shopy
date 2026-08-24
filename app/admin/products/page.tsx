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
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCustomUrl, setIsCustomUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "tops",
    categoryLabel: "Tops",
    price: "",
    originalPrice: "",
    stockCount: "15",
    description: "",
    imageUrl: "",
    tag: "NEW",
    featured: false,
  });
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview demo
    const localDemoUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(localDemoUrl);

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
        setLocalPreviewUrl(data.url);
        showToast("Product photo compressed & saved to DB bucket.", "success");
      } else {
        showToast(data.error || "Failed to upload image.", "error");
      }
    } catch {
      showToast("Network error uploading image.", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const [categories, setCategories] = useState<any[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
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
    fetchProducts();
    fetchCategories();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: categories.length > 0 ? categories[0].slug : "tops",
      categoryLabel: categories.length > 0 ? categories[0].name : "Tops",
      price: "",
      originalPrice: "",
      stockCount: "15",
      description: "",
      imageUrl: "",
      tag: "NEW",
      featured: false,
    });
    setLocalPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      categoryLabel: prod.categoryLabel,
      price: String(prod.price),
      originalPrice: prod.originalPrice ? String(prod.originalPrice) : "",
      stockCount: String(prod.stockCount),
      description: prod.description || "",
      imageUrl: prod.images[0] || "",
      tag: prod.tag || "NEW",
      featured: Boolean(prod.featured),
    });
    setLocalPreviewUrl(prod.images[0] || "");
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

    if (formData.imageUrl.startsWith("blob:")) {
      showToast("Image is still optimizing, please wait a moment.", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // Edit existing product
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: formData.name,
            category: formData.category,
            categoryLabel: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
            price: Number(formData.price),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
            stockCount: Number(formData.stockCount),
            description: formData.description,
            images: [formData.imageUrl],
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
            name: formData.name,
            category: formData.category,
            categoryLabel: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
            price: Number(formData.price),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
            stockCount: Number(formData.stockCount),
            description: formData.description,
            images: [formData.imageUrl],
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

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove or archive "${name}" from the store?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.archived) {
          showToast(data.message || "Product was safely archived to preserve customer order history.", "info");
        } else {
          showToast("Product permanently deleted from catalog.", "success");
        }
        fetchProducts();
      } else {
        showToast(data.error || "Failed to delete product.", "error");
      }
    } catch {
      showToast("Network error deleting product.", "error");
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
              <option value="tops">Tops</option>
              <option value="bottoms">Bottoms</option>
              <option value="footwear">Footwear</option>
              <option value="fragrances">Fragrances</option>
              <option value="co-ord-sets">Co-Ord Sets</option>
              <option value="accessories">Accessories</option>
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
                          onClick={() => handleDeleteProduct(p.id, p.name)}
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
                      className="h-10 w-full bg-[#E8E8E8] border border-[#BBBFCA] px-3.5 text-xs text-[#495464] uppercase focus:outline-none focus:border-[#495464] transition-colors"
                    >
                      {categories.length > 0 ? (
                        categories.map((c) => (
                          <option key={c.id || c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="tops">Tops</option>
                          <option value="bottoms">Bottoms</option>
                          <option value="footwear">Footwear</option>
                          <option value="fragrances">Fragrances</option>
                          <option value="co-ord-sets">Co-Ord Sets</option>
                          <option value="accessories">Accessories</option>
                        </>
                      )}
                    </select>
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

                {/* 4. Product Image Upload with Sharp processing & Compact Demo Preview */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464]">
                    Product Photography *
                  </label>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/webp, image/avif, image/jpg"
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 bg-[#495464] text-[#F4F4F2] px-3.5 py-2 text-[10px] uppercase tracking-wider font-medium hover:bg-[#363E4B] transition-colors flex-shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      <span>{uploadingImage ? "Sharpening..." : "Upload from Computer"}</span>
                    </button>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Or paste external image URL..."
                      className="flex-1 bg-[#E8E8E8] border border-[#BBBFCA] p-2 text-xs font-mono text-[#495464] focus:outline-none focus:border-[#495464]"
                    />
                  </div>

                  {/* Compact Picture Demo Preview Box */}
                  {(localPreviewUrl || formData.imageUrl) && (
                    <div className="flex items-center justify-between gap-3 p-2 bg-[#E8E8E8] border border-[#BBBFCA] shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 bg-[#BBBFCA]/40 flex-shrink-0 overflow-hidden border border-[#BBBFCA]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={localPreviewUrl || formData.imageUrl}
                            alt="Product Preview Demo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#495464] flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${uploadingImage ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                            {uploadingImage ? "Compressing & Saving to DB..." : "Picture Ready"}
                          </span>
                          <p className="text-[10px] text-[#495464]/60 truncate font-mono max-w-[240px] sm:max-w-[340px]">
                            {formData.imageUrl || "Optimizing with Sharp..."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, imageUrl: "" }));
                          setLocalPreviewUrl("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-[10px] uppercase tracking-wider text-[#495464] hover:text-black px-2.5 py-1 bg-[#BBBFCA]/40 hover:bg-[#BBBFCA]/70 transition-colors flex-shrink-0 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
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
      </main>
    </div>
  );
}
