"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Truck, Package, ArrowRight, Loader2 } from "lucide-react";

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="pt-20 pb-20 flex justify-center items-center bg-[#F4F4F2] text-[#495464]">
        <Loader2 className="w-8 h-8 animate-spin text-[#495464]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-20 pb-20 text-center bg-[#F4F4F2] text-[#495464]">
        <div className="max-w-md mx-auto px-6">
          <h1 className="font-serif text-3xl mb-3">Order Not Found</h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mb-8">
            The requested order could not be located or you are not authorized to view it.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#495464] text-[#F4F4F2] px-8 py-3 text-xs uppercase tracking-widest"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-3xl mx-auto px-6">
        {/* Success Header */}
        <div className="text-center py-8 border-b border-[#BBBFCA]/30 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E8E8E8] text-[#495464] mb-2 border border-[#BBBFCA]/50 animate-fadeIn">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block font-medium">
            CONFIRMED &amp; DISPATCH QUEUED
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#495464]">
            Thank you for your order
          </h1>
          <p className="text-xs sm:text-sm text-[#495464]/80 tracking-wider max-w-md mx-auto">
            Order <span className="font-semibold text-[#495464]">{order.orderNumber}</span> has been confirmed and is being prepared in our atelier.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="mt-10 bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-8 space-y-8">
          {/* Tracking Step Tracker */}
          <div className="grid grid-cols-3 gap-2 text-center border-b border-[#BBBFCA]/30 pb-6">
            <div className="space-y-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#495464]" />
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#495464]">
                Confirmed
              </p>
            </div>
            <div className="space-y-1 opacity-50">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#BBBFCA]" />
              <p className="text-[10px] uppercase tracking-widest font-medium text-[#495464]">
                Atelier Prep
              </p>
            </div>
            <div className="space-y-1 opacity-50">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#BBBFCA]" />
              <p className="text-[10px] uppercase tracking-widest font-medium text-[#495464]">
                Dispatched
              </p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#495464]">
              Ordered Items ({order.items.length})
            </h3>
            <div className="divide-y divide-[#BBBFCA]/20">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-14 bg-[#E8E8E8] flex-shrink-0 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-xs font-medium text-[#495464]">{item.name}</h4>
                      <p className="text-[10px] text-[#495464]/60 tracking-wider">
                        Qty: {item.quantity} • {item.size} • {item.color}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#495464]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-2 text-xs tracking-wider text-[#495464]/80 border-t border-[#BBBFCA]/30 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? "Complimentary" : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-serif font-medium text-[#495464] pt-3 border-t border-[#BBBFCA]/30">
              <span>Total Paid / Due</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Shipping Destination */}
          <div className="border-t border-[#BBBFCA]/30 pt-4 text-xs tracking-wider text-[#495464]/80">
            <span className="font-semibold block uppercase text-[10px] tracking-widest text-[#495464] mb-1">
              Dispatch Destination:
            </span>
            <p>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
            </p>
            <p>Phone: {order.shippingAddress.phone}</p>
            <p className="mt-2 text-[11px] text-[#495464]/60">
              Payment Method: {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"}
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-[#495464] text-[#F4F4F2] px-8 py-3.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
          >
            <span>Return to Editorial Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
