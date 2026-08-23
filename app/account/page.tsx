"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { User, Package, LogOut, Loader2, ArrowRight, ShieldCheck, ExternalLink } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Background check for unauthorized visitors
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/account");
    }
  }, [user, loading, router]);

  // Fetch orders immediately on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchUserOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOrders(data.orders || []);
          }
        }
      } catch {
        if (isMounted) {
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoadingOrders(false);
        }
      }
    }

    fetchUserOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // If initial load with no cached user and still validating
  if (loading && !user) {
    return (
      <div className="min-h-[60vh] pt-20 pb-20 flex flex-col justify-center items-center bg-[#F4F4F2] text-[#495464] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#495464]" />
        <span className="text-xs uppercase tracking-widest text-[#495464]/60">
          Loading Client Account...
        </span>
      </div>
    );
  }

  // If verified unauthenticated
  if (!user) {
    return (
      <div className="min-h-[60vh] pt-20 pb-20 flex flex-col justify-center items-center bg-[#F4F4F2] text-[#495464] px-6 text-center space-y-6">
        <span className="text-xs uppercase tracking-widest text-[#495464]/60 font-medium">
          ACCOUNT ACCESS REQUIRED
        </span>
        <h1 className="font-serif text-3xl font-medium text-[#495464]">
          Sign in to your client account
        </h1>
        <p className="text-xs text-[#495464]/70 tracking-wider uppercase max-w-sm">
          Please sign in to view your orders, saved preferences, and atelier membership.
        </p>
        <Link
          href="/login?redirect=/account"
          className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-8 py-3.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
        >
          <span>Sign In to Account</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between py-6 border-b border-[#BBBFCA]/30 mb-12 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-1 font-medium">
              CLIENT DASHBOARD
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#495464]">
              Welcome, {user.name}
            </h1>
            <p className="text-xs text-[#495464]/70 tracking-wider mt-1">{user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-4 py-2 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
              >
                <span>Admin Operations</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 border border-[#BBBFCA] px-4 py-2 text-xs uppercase tracking-widest text-[#495464] hover:bg-[#495464] hover:text-[#F4F4F2] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Orders History */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="font-serif text-xl font-medium text-[#495464] pb-2 border-b border-[#BBBFCA]/30">
              Order History {loadingOrders ? "" : `(${orders.length})`}
            </h2>

            {loadingOrders ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="bg-[#E8E8E8]/30 border border-[#BBBFCA]/30 p-6 animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-[#BBBFCA]/40 rounded w-1/3"></div>
                    <div className="h-3 bg-[#BBBFCA]/30 rounded w-1/2"></div>
                    <div className="h-10 bg-[#BBBFCA]/20 rounded"></div>
                  </div>
                ))}
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
                  className="inline-block mt-4 bg-[#495464] text-[#F4F4F2] px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-[#363E4B] transition-colors"
                >
                  Browse Catalogue
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-6 space-y-4 shadow-sm"
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
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {ord.items &&
                        ord.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs tracking-wider">
                            <span>
                              {item.quantity}x {item.name} {item.size ? `(${item.size})` : ""}
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
            <h2 className="font-serif text-xl font-medium text-[#495464] pb-2 border-b border-[#BBBFCA]/30">
              Client Profile
            </h2>
            <div className="bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-6 space-y-4 shadow-sm">
              <div className="text-xs space-y-3.5 text-[#495464]/80 tracking-wider">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#495464]/60 font-semibold block mb-0.5">
                    Full Name
                  </span>
                  <span className="font-medium text-[#495464] text-sm block">
                    {user.name}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#BBBFCA]/20">
                  <span className="text-[10px] uppercase tracking-widest text-[#495464]/60 font-semibold block mb-0.5">
                    Email Address
                  </span>
                  <span className="font-medium text-[#495464] text-sm block break-all">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
