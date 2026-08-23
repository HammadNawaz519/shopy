"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Loader2,
  Package,
  Plus,
  Tag,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Dashboard Overview"
          subtitle="Real-time E-commerce Operations"
        />
        <div className="flex-1 flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#495464]" />
        </div>
      </div>
    );
  }

  const { metrics, pipeline, recentOrders, lowStockProducts } = data || {
    metrics: {},
    pipeline: {},
    recentOrders: [],
    lowStockProducts: [],
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Dashboard Overview"
        subtitle="Real-time E-commerce Operations"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue */}
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#495464]/70 font-medium">
                Total Revenue
              </span>
              <div className="p-2 bg-[#E8E8E8] text-[#495464]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl lg:text-3xl font-medium text-[#495464] mt-3">
              {formatPrice(metrics.totalRevenue || 0)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verified from database</span>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#495464]/70 font-medium">
                Total Orders
              </span>
              <div className="p-2 bg-[#E8E8E8] text-[#495464]">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl lg:text-3xl font-medium text-[#495464] mt-3">
              {metrics.totalOrders || 0}
            </p>
            <p className="text-[11px] text-[#495464]/70 mt-2">
              {metrics.pendingOrders || 0} pending dispatch
            </p>
          </div>

          {/* Customers */}
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#495464]/70 font-medium">
                Registered Clients
              </span>
              <div className="p-2 bg-[#E8E8E8] text-[#495464]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl lg:text-3xl font-medium text-[#495464] mt-3">
              {metrics.totalCustomers || 0}
            </p>
            <p className="text-[11px] text-[#495464]/70 mt-2">Verified customer accounts</p>
          </div>

          {/* Low Stock Warning */}
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#495464]/70 font-medium">
                Inventory Alerts
              </span>
              <div className="p-2 bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl lg:text-3xl font-medium text-[#495464] mt-3">
              {metrics.lowStockCount + metrics.outOfStockCount} SKUs
            </p>
            <p className="text-[11px] text-amber-800 mt-2 font-medium">
              {metrics.lowStockCount} low stock • {metrics.outOfStockCount} out of stock
            </p>
          </div>
        </div>

        {/* Order Lifecycle Pipeline */}
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#BBBFCA]/30 pb-4">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#495464]">
                Order Fulfillment Pipeline
              </h2>
              <p className="text-xs text-[#495464]/60 uppercase tracking-widest mt-0.5">
                Real-time Status Tracking Across Warehouse
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs uppercase tracking-widest text-[#495464] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Confirmed / Pending */}
            <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 mx-auto flex items-center justify-center mb-2">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#495464]/70 font-semibold block">
                Pending / Confirmed
              </span>
              <span className="font-serif text-2xl font-semibold text-[#495464] block mt-1">
                {pipeline.pending || 0}
              </span>
            </div>

            {/* Processing */}
            <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center mb-2">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#495464]/70 font-semibold block">
                Atelier Prep
              </span>
              <span className="font-serif text-2xl font-semibold text-[#495464] block mt-1">
                {pipeline.processing || 0}
              </span>
            </div>

            {/* Shipped */}
            <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 mx-auto flex items-center justify-center mb-2">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#495464]/70 font-semibold block">
                Dispatched / Transit
              </span>
              <span className="font-serif text-2xl font-semibold text-[#495464] block mt-1">
                {pipeline.shipped || 0}
              </span>
            </div>

            {/* Delivered */}
            <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#495464]/70 font-semibold block">
                Delivered
              </span>
              <span className="font-serif text-2xl font-semibold text-[#495464] block mt-1">
                {pipeline.delivered || 0}
              </span>
            </div>

            {/* Cancelled */}
            <div className="bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 text-center col-span-2 md:col-span-1">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 mx-auto flex items-center justify-center mb-2">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#495464]/70 font-semibold block">
                Cancelled / Returned
              </span>
              <span className="font-serif text-2xl font-semibold text-[#495464] block mt-1">
                {pipeline.cancelled || 0}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Recent Orders + Quick Actions & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Orders (8 Cols) */}
          <div className="lg:col-span-8 bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-4">
              <h3 className="font-serif text-xl font-medium text-[#495464]">Recent Orders</h3>
              <Link
                href="/admin/orders"
                className="text-xs uppercase tracking-wider text-[#495464]/80 hover:text-[#495464] underline"
              >
                View all ({metrics.totalOrders || 0})
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#495464]/60 uppercase tracking-widest">
                No orders recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tracking-wider">
                  <thead>
                    <tr className="border-b border-[#BBBFCA]/30 text-[#495464]/60 uppercase text-[10px]">
                      <th className="pb-3 font-semibold">Order</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Total</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#BBBFCA]/20">
                    {recentOrders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                        <td className="py-3.5 font-medium text-[#495464]">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 text-[#495464]/80">
                          {ord.shippingAddress.firstName} {ord.shippingAddress.lastName}
                        </td>
                        <td className="py-3.5 font-semibold text-[#495464]">
                          {formatPrice(ord.total)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider ${
                              ord.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : ord.status === "SHIPPED"
                                ? "bg-indigo-100 text-indigo-800"
                                : ord.status === "PROCESSING"
                                ? "bg-amber-100 text-amber-800"
                                : ord.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-200 text-[#495464]"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            href={`/admin/orders?highlight=${ord.id}`}
                            className="text-xs uppercase tracking-widest text-[#495464] font-semibold hover:underline"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Quick Operations & Low Stock (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-medium text-[#495464] border-b border-[#BBBFCA]/30 pb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/admin/products"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#E8E8E8] border border-[#BBBFCA]/40 hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors text-center group"
                >
                  <Plus className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Add Product</span>
                </Link>
                <Link
                  href="/admin/orders?status=PENDING"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#E8E8E8] border border-[#BBBFCA]/40 hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors text-center group"
                >
                  <ShoppingBag className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Pending Orders</span>
                </Link>
                <Link
                  href="/admin/discounts"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#E8E8E8] border border-[#BBBFCA]/40 hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors text-center group"
                >
                  <Tag className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Add Coupon</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#E8E8E8] border border-[#BBBFCA]/40 hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors text-center group"
                >
                  <TrendingUp className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Analytics</span>
                </Link>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#BBBFCA]/30 pb-3">
                <h3 className="font-serif text-lg font-medium text-[#495464]">Inventory Watch</h3>
                <Link
                  href="/admin/inventory"
                  className="text-xs uppercase tracking-wider text-[#495464]/80 hover:text-[#495464] underline"
                >
                  Manage
                </Link>
              </div>

              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-emerald-800 font-medium tracking-wide">
                  ✓ All products have healthy inventory levels.
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-2 bg-[#E8E8E8]/50 border border-[#BBBFCA]/30"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-[#495464] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#495464]/60">{p.categoryLabel}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold whitespace-nowrap">
                        {p.stockCount} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
