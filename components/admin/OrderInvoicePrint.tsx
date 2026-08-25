"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Printer, X, ShieldCheck, Mail, Phone, MapPin, Calendar, CreditCard, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface OrderInvoicePrintProps {
  order: OrderRecord;
  onClose: () => void;
  autoTriggerPrint?: boolean;
}

export default function OrderInvoicePrint({
  order,
  onClose,
  autoTriggerPrint = true,
}: OrderInvoicePrintProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (autoTriggerPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoTriggerPrint]);

  const handlePrint = () => {
    window.print();
  };

  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-start sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container / Modal Wrapper */}
      <div className="relative w-full max-w-4xl bg-white text-[#111111] shadow-2xl my-4 sm:my-8 print:my-0 print:shadow-none print:w-full print:max-w-none">
        
        {/* Floating Print & Close Action Bar (Hidden during actual print) */}
        <div className="sticky top-0 z-30 bg-[#495464] text-[#F4F4F2] px-6 py-3 flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">
              Print Order Invoice • {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-[#F4F4F2] text-[#495464] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now (A4 / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#F4F4F2]/80 hover:text-white transition-colors"
              aria-label="Close invoice preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE INVOICE DOCUMENT BODY (Optimized for A4 Paper & PDF Generation)  */}
        {/* ========================================================================= */}
        <div id="printable-order-invoice" className="p-8 sm:p-12 print:p-8 space-y-8 bg-white font-sans">
          
          {/* 1. Header & Brand Identity */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-[#111111] pb-6 gap-6">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-[0.25em] uppercase text-[#111111]">
                SHOPY
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#555555] mt-1 font-medium">
                Maison Atelier • Order &amp; Tax Invoice
              </p>
              <p className="text-xs text-[#666666] mt-2 font-mono">
                Order Reference: <strong className="text-[#111111]">{order.orderNumber}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div className="inline-block bg-[#F4F4F2] border border-[#BBBFCA]/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#111111] mb-2">
                Status: {order.status}
              </div>
              <p className="text-[#555555]">
                Date: <span className="font-mono text-[#111111]">{formattedDate}</span>
              </p>
              <p className="text-[#555555]">
                Payment Method:{" "}
                <span className="font-semibold uppercase text-[#111111]">
                  {order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Card / Electronic"}
                </span>
              </p>
              <p className="text-[#555555]">
                Payment Status:{" "}
                <span
                  className={`font-semibold uppercase ${
                    order.paymentStatus === "PAID"
                      ? "text-emerald-700"
                      : order.paymentStatus === "FAILED"
                      ? "text-red-700"
                      : "text-amber-700"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          {/* 2. Customer & Delivery Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FAFAFA] border border-[#E5E5E5] p-5 text-xs">
            {/* Shipping Destination */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#111111] block border-b border-[#E5E5E5] pb-1.5">
                Shipping Destination (Client)
              </span>
              <p className="font-semibold text-sm text-[#111111]">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p className="text-[#444444] leading-relaxed">
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-[#555555] pt-1">
                <strong>Phone:</strong> {order.shippingAddress.phone || "N/A"}
              </p>
              <p className="text-[#555555]">
                <strong>Email:</strong> {order.shippingAddress.email}
              </p>
            </div>

            {/* Billing & Order Context */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#111111] block border-b border-[#E5E5E5] pb-1.5">
                Billing &amp; Merchant Details
              </span>
              <p className="font-semibold text-sm text-[#111111]">
                SHOPY Online Flagship Atelier
              </p>
              <p className="text-[#444444] leading-relaxed">
                Concierge &amp; Dispatch Division
                <br />
                Pakistan Operations &amp; Nationwide Delivery
              </p>
              <p className="text-[#555555] pt-1">
                <strong>Customer ID:</strong> {order.userId || "Guest Checkout"}
              </p>
              <p className="text-[#555555]">
                <strong>Billing Address:</strong> Same as shipping destination
              </p>
            </div>
          </div>

          {/* 3. Order Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                Purchased Pieces &amp; Line Items ({order.items.length})
              </span>
            </div>

            <div className="border border-[#111111] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111111] text-[#F4F4F2] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 font-medium w-14 text-center">Piece</th>
                    <th className="p-3 font-medium">Description &amp; Specifications</th>
                    <th className="p-3 font-medium text-center">SKU / ID</th>
                    <th className="p-3 font-medium text-center">Qty</th>
                    <th className="p-3 font-medium text-right">Unit Price</th>
                    <th className="p-3 font-medium text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {order.items.map((item, idx) => {
                    const itemKey = item.id || `item_${idx}`;
                    const hasImgError = imageErrors[itemKey];
                    const rawImg = item.image || "/editorial-craft.jpg";
                    const fallbackImg = "/editorial-craft.jpg";

                    return (
                      <tr key={idx} className="hover:bg-[#F9F9F9] transition-colors">
                        {/* Thumbnail */}
                        <td className="p-2 text-center align-middle">
                          <div className="relative w-10 h-12 bg-[#EFEFEF] mx-auto overflow-hidden border border-[#DDDDDD]">
                            <Image
                              src={hasImgError ? fallbackImg : rawImg}
                              alt={item.name}
                              fill
                              sizes="48px"
                              onError={() => handleImageError(itemKey)}
                              className="object-cover object-center"
                            />
                          </div>
                        </td>

                        {/* Product Specifications */}
                        <td className="p-3 align-middle">
                          <p className="font-serif font-semibold text-sm text-[#111111]">{item.name}</p>
                          <div className="flex flex-wrap gap-2 text-[10px] text-[#555555] mt-0.5 font-mono uppercase">
                            {item.size && (
                              <span className="bg-[#EFEFEF] px-1.5 py-0.5 rounded-2xs">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="bg-[#EFEFEF] px-1.5 py-0.5 rounded-2xs">
                                Color: {item.color}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SKU / Product ID */}
                        <td className="p-3 text-center align-middle font-mono text-[10px] text-[#666666]">
                          {item.productId ? item.productId.substring(0, 12) : "N/A"}
                        </td>

                        {/* Quantity */}
                        <td className="p-3 text-center align-middle font-mono font-semibold text-sm text-[#111111]">
                          {item.quantity}
                        </td>

                        {/* Unit Price */}
                        <td className="p-3 text-right align-middle font-mono text-xs text-[#444444]">
                          {formatPrice(item.price)}
                        </td>

                        {/* Line Total */}
                        <td className="p-3 text-right align-middle font-mono font-semibold text-xs text-[#111111]">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Financial Breakdown & Order Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
            {/* Notes & Authenticity Notice */}
            <div className="sm:col-span-7 space-y-4">
              {order.notes && (
                <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 text-xs space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#111111] block">
                    Customer Instructions / Delivery Notes:
                  </span>
                  <p className="text-[#444444] italic">&ldquo;{order.notes}&rdquo;</p>
                </div>
              )}

              <div className="border border-[#E5E5E5] p-3.5 space-y-1 text-[10px] text-[#666666] leading-relaxed">
                <p className="font-semibold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  SHOPY Quality Guarantee &amp; Return Policy
                </p>
                <p>
                  All pieces are crafted with certified materials. Returns and exchanges are accepted within
                  7 days of delivery with original tags intact. For concierge support, contact{" "}
                  <strong>concierge@shopy.com</strong> or our official hotline.
                </p>
              </div>
            </div>

            {/* Price Summary Breakdown */}
            <div className="sm:col-span-5 bg-[#FAFAFA] border border-[#111111] p-5 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[#444444]">
                <span>Items Subtotal:</span>
                <span className="font-mono">{formatPrice(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between items-center text-emerald-800 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Applied Promotion / Discount:
                  </span>
                  <span className="font-mono">-{formatPrice(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#444444]">
                <span>Insured Nationwide Shipping:</span>
                <span className="font-mono">
                  {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#444444]">
                <span>Applicable Taxes &amp; GST:</span>
                <span className="font-mono text-[10px] text-[#666666]">Included in Total</span>
              </div>

              <div className="pt-3 border-t-2 border-[#111111] flex justify-between items-baseline">
                <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#111111]">
                  Grand Total:
                </span>
                <span className="font-serif text-xl font-bold text-[#111111] tracking-tight">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Document Footer Stamp */}
          <div className="border-t border-[#E5E5E5] pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase tracking-widest text-[#777777] gap-3">
            <p>SHOPY ATELIER • ALL RIGHTS RESERVED • OFFICIAL TAX INVOICE</p>
            <p className="font-mono">VERIFIED DISPATCH • ID: {order.id}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
