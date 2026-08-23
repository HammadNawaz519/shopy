"use client";

import React, { useEffect, useState } from "react";
import { Users, Search, Loader2, Mail, ShieldCheck, ShoppingBag } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      showToast("Failed to load customer list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Client Registry"
        subtitle="Manage Customer Relationships, Orders & Lifetime Spend"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#495464]">Registered Client Accounts</h2>
            <p className="text-xs text-[#495464]/60">
              {customers.length} total clients • Zero sensitive credentials exposed
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCustomers();
            }}
            className="flex gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#495464]/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#E8E8E8] border border-[#BBBFCA] pl-9 pr-3 py-2 text-xs text-[#495464] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-[#495464] text-[#F4F4F2] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#363E4B]"
            >
              Search
            </button>
          </form>
        </div>

        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#495464]/60 uppercase tracking-widest">
              No clients found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tracking-wider">
                <thead className="bg-[#E8E8E8]/70 border-b border-[#BBBFCA]/40 text-[#495464] uppercase text-[10px]">
                  <tr>
                    <th className="p-4 font-semibold">Client Name</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Total Orders</th>
                    <th className="p-4 font-semibold">Lifetime Spend</th>
                    <th className="p-4 font-semibold">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                      <td className="p-4 font-medium text-[#495464]">
                        {c.name}
                      </td>
                      <td className="p-4 text-[#495464]/80 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#495464]/50" />
                        <span>{c.email}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider ${
                            c.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-[#E8E8E8] text-[#495464]"
                          }`}
                        >
                          {c.role}
                        </span>
                      </td>
                      <td className="p-4 text-[#495464]/80 font-medium">
                        {c.orderCount} orders
                      </td>
                      <td className="p-4 font-serif font-semibold text-[#495464]">
                        {formatPrice(c.totalSpent || 0)}
                      </td>
                      <td className="p-4 text-[#495464]/60 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
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
