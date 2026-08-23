"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Boxes,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

export default function AdminInventoryPage() {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
        setSummary(data.summary || {});
      }
    } catch {
      showToast("Failed to load inventory data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const handleAdjustStock = async (id: string, newStock: number) => {
    const safeStock = Math.max(0, newStock);
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stockCount: safeStock }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInventory((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  stockCount: safeStock,
                  isLowStock: safeStock > 0 && safeStock <= 5,
                  isOutOfStock: safeStock === 0,
                }
              : item
          )
        );
        showToast("Stock updated in database.", "success");
      } else {
        showToast(data.error || "Failed to update stock.", "error");
      }
    } catch {
      showToast("Network error updating stock.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Inventory Operations"
        subtitle="Stock Levels, Safety Buffers & Real-Time Adjustments"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
        {/* KPI Mini Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 shadow-xs">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-[#495464]/60 block">
              Total SKUs
            </span>
            <span className="font-serif text-2xl font-semibold text-[#495464] block mt-1">
              {summary.totalSKUs || 0}
            </span>
          </div>

          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 shadow-xs">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-[#495464]/60 block">
              Total Stock Units
            </span>
            <span className="font-serif text-2xl font-semibold text-[#495464] block mt-1">
              {summary.totalUnits || 0}
            </span>
          </div>

          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 shadow-xs">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-amber-800 font-semibold block">
              Low Stock Warnings
            </span>
            <span className="font-serif text-2xl font-semibold text-amber-800 block mt-1">
              {summary.lowStockCount || 0}
            </span>
          </div>

          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 shadow-xs">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-red-800 font-semibold block">
              Out of Stock
            </span>
            <span className="font-serif text-2xl font-semibold text-red-800 block mt-1">
              {summary.outOfStockCount || 0}
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 shadow-xs flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            {["all", "low", "out"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider font-medium transition-colors ${
                  filter === f
                    ? "bg-[#495464] text-[#F4F4F2]"
                    : "bg-[#E8E8E8] text-[#495464] hover:bg-[#BBBFCA]/30"
                }`}
              >
                {f === "all" ? "All Items" : f === "low" ? "Low Stock (≤5)" : "Out of Stock"}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchInventory();
            }}
            className="flex gap-2"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#495464]/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#E8E8E8] border border-[#BBBFCA] pl-9 pr-3 py-1.5 text-xs text-[#495464] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-[#495464] text-[#F4F4F2] px-3 py-1.5 text-xs uppercase tracking-wider"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Table */}
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
                    <th className="p-4 font-semibold">Silhouette</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Unit Price</th>
                    <th className="p-4 font-semibold">Stock Status</th>
                    <th className="p-4 font-semibold text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="relative w-10 h-12 bg-[#E8E8E8] flex-shrink-0 border border-[#BBBFCA]/30 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-serif text-sm font-medium text-[#495464]">{item.name}</p>
                          <p className="text-[10px] text-[#495464]/60">ID: {item.id}</p>
                        </div>
                      </td>
                      <td className="p-4 text-[10px] uppercase font-semibold text-[#495464]/80">
                        {item.category}
                      </td>
                      <td className="p-4 font-serif font-semibold text-[#495464]">
                        {formatPrice(item.price)}
                      </td>
                      <td className="p-4">
                        {item.isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-semibold">
                            <XCircle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : item.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock ({item.stockCount})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Healthy ({item.stockCount})
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center border border-[#BBBFCA] bg-[#E8E8E8]">
                          <button
                            disabled={updatingId === item.id || item.stockCount <= 0}
                            onClick={() => handleAdjustStock(item.id, item.stockCount - 1)}
                            className="px-2 py-1 text-[#495464] hover:bg-[#BBBFCA]/40 disabled:opacity-40"
                            title="Decrease Stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1 font-serif font-semibold text-xs text-[#495464] min-w-[36px] text-center">
                            {updatingId === item.id ? "..." : item.stockCount}
                          </span>
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => handleAdjustStock(item.id, item.stockCount + 1)}
                            className="px-2 py-1 text-[#495464] hover:bg-[#BBBFCA]/40 disabled:opacity-40"
                            title="Increase Stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
