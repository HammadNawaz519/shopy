"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { User, Package, LogOut, Loader2, ArrowRight, Clock, ShieldCheck } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchUserOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
        // ignore
      } finally {
        setLoadingOrders(false);
      }
    }
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="pt-36 pb-32 flex justify-center items-center bg-[#F4F4F2] text-[#495464]">
        <Loader2 className="w-8 h-8 animate-spin text-[#495464]" />
      </div>
    );
  }

  return (
    <div className="pt-28 pb-32 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Centered Brand Signature */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <img
              src="/logo.svg"
              alt="SHOPY"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between py-6 border-b border-[#BBBFCA]/30 mb-12 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-1">
              CLIENT DASHBOARD
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#495464]">
              Welcome, {user.name}
            </h1>
            <p className="text-xs text-[#495464]/70 tracking-wider mt-1">{user.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 border border-[#BBBFCA] px-4 py-2 text-xs uppercase tracking-widest text-[#495464] hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Orders History */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="font-serif text-2xl font-medium text-[#495464] pb-2 border-b border-[#BBBFCA]/30">
              Order History ({orders.length})
            </h2>

            {loadingOrders ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-8 text-center space-y-3">
                <Package className="w-8 h-8 text-[#495464]/50 mx-auto" />
                <p className="font-serif text-lg text-[#495464]">No previous orders</p>
                <p className="text-xs text-[#495464]/60 tracking-wider">
                  You haven&apos;t placed an order yet with this account.
                </p>
                <Link
                  href="/products"
                  className="inline-block mt-4 bg-[#495464] text-[#F4F4F2] px-6 py-2.5 text-xs uppercase tracking-widest"
                >
                  Browse Catalogue
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#BBBFCA]/20 pb-3">
                      <div>
                        <span className="font-serif text-base font-semibold text-[#495464]">
                          {ord.orderNumber}
                        </span>
                        <p className="text-[11px] text-[#495464]/60 tracking-wider">
                          Placed on {new Date(ord.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-[#495464] text-[#F4F4F2] text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1">
                          {ord.status}
                        </span>
                        <Link
                          href={`/order-confirmation/${ord.id}`}
                          className="text-xs uppercase tracking-widest text-[#495464] hover:underline"
                        >
                          View Receipt →
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {ord.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs tracking-wider">
                          <span>
                            {item.quantity}x {item.name} ({item.size})
                          </span>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-[#BBBFCA]/20 text-xs font-semibold text-[#495464]">
                      <span>Total Amount:</span>
                      <span className="font-serif text-sm">{formatPrice(ord.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Account Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/40 p-6 space-y-4">
              <h3 className="font-serif text-lg font-medium text-[#495464]">Client Details</h3>
              <div className="text-xs space-y-2 text-[#495464]/80 tracking-wider">
                <p>
                  <span className="font-semibold text-[#495464]">Full Name:</span> {user.name}
                </p>
                <p>
                  <span className="font-semibold text-[#495464]">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold text-[#495464]">Role:</span> {user.role.toUpperCase()}
                </p>
                <p>
                  <span className="font-semibold text-[#495464]">Currency:</span> PKR (Rs.)
                </p>
              </div>

              <div className="pt-4 border-t border-[#BBBFCA]/30 flex items-center gap-2 text-[10px] text-[#495464]/60 tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#495464]" />
                <span>Protected by IDOR Guard &amp; Session Isolation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
