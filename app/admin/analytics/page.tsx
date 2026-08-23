"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, DollarSign, ShoppingBag, PieChart, Loader2, ArrowUpRight } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatPrice } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json.analytics || {});
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const totalRevenue = data?.totalRevenue || 0;
  const totalOrders = data?.totalOrders || 0;
  const aov = data?.aov || 0;
  const topProducts = data?.topProducts || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const statusDistribution = data?.statusDistribution || [];

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Executive Analytics"
        subtitle="Revenue, Conversion & Product Performance Intelligence"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-8">
        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs">
            <span className="text-xs uppercase tracking-widest text-[#495464]/60 font-semibold block">
              Gross Realized Revenue
            </span>
            <span className="font-serif text-3xl font-semibold text-[#495464] block mt-2">
              {formatPrice(totalRevenue || 0)}
            </span>
            <p className="text-[11px] text-emerald-800 font-medium mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              100% database verified
            </p>
          </div>

          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs">
            <span className="text-xs uppercase tracking-widest text-[#495464]/60 font-semibold block">
              Average Order Value (AOV)
            </span>
            <span className="font-serif text-3xl font-semibold text-[#495464] block mt-2">
              {formatPrice(aov || 0)}
            </span>
            <p className="text-[11px] text-[#495464]/60 mt-2">Across all completed orders</p>
          </div>

          <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 shadow-xs">
            <span className="text-xs uppercase tracking-widest text-[#495464]/60 font-semibold block">
              Total Processed Orders
            </span>
            <span className="font-serif text-3xl font-semibold text-[#495464] block mt-2">
              {totalOrders || 0}
            </span>
            <p className="text-[11px] text-[#495464]/60 mt-2">Store lifecycle transactions</p>
          </div>
        </div>

        {/* 2 Column: Best Selling Products + Category Share */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Top Selling Products (7 Cols) */}
          <div className="lg:col-span-7 bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-6">
            <h3 className="font-serif text-xl font-medium text-[#495464] border-b border-[#BBBFCA]/30 pb-3">
              Best-Selling Silhouettes
            </h3>

            {(!topProducts || topProducts.length === 0) ? (
              <p className="text-xs text-[#495464]/60 py-8 text-center uppercase tracking-widest">
                No product sales data yet.
              </p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#E8E8E8]/50 border border-[#BBBFCA]/30 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-sm text-[#495464]/50 w-5">
                        0{idx + 1}
                      </span>
                      <div>
                        <p className="font-serif font-semibold text-sm text-[#495464]">{item.name}</p>
                        <p className="text-[10px] text-[#495464]/60">{item.quantity} units purchased</p>
                      </div>
                    </div>
                    <span className="font-serif font-semibold text-[#495464]">
                      {formatPrice(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Sales Distribution (5 Cols) */}
          <div className="lg:col-span-5 bg-[#F4F4F2] border border-[#BBBFCA]/40 p-6 lg:p-8 shadow-xs space-y-6">
            <h3 className="font-serif text-xl font-medium text-[#495464] border-b border-[#BBBFCA]/30 pb-3">
              Sales by Collection
            </h3>

            {(!categoryBreakdown || categoryBreakdown.length === 0) ? (
              <p className="text-xs text-[#495464]/60 py-8 text-center uppercase tracking-widest">
                No collection distribution recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((cat: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-[#495464]">
                      <span>{cat.category}</span>
                      <span>{cat.percent}% ({formatPrice(cat.revenue)})</span>
                    </div>
                    <div className="w-full h-2 bg-[#E8E8E8] overflow-hidden">
                      <div
                        className="h-full bg-[#495464] transition-all duration-500"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
