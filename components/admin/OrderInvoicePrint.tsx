"use client";

import React, { useState } from "react";
import { ShieldCheck, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface OrderItem {
  id?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

export interface OrderRecord {
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
}

export default function OrderInvoicePrint({ order }: OrderInvoicePrintProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full bg-white text-[#111111] p-6 sm:p-10 font-sans text-xs leading-normal">
      {/* ========================================================================= */}
      {/* 1. Header & Brand Identity                                                */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-start border-b-2 border-[#111111] pb-6 mb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-[0.25em] uppercase text-[#111111]">
            SHOPY
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#495464] mt-1 font-semibold">
            Maison Atelier • Official Order Receipt &amp; Tax Invoice
          </p>
          <div className="mt-3 space-y-0.5 text-xs text-[#495464]">
            <p>
              Order Reference: <strong className="text-[#111111] font-mono text-sm">{order.orderNumber}</strong>
            </p>
            <p>
              Internal Record ID: <span className="font-mono text-[10px] text-[#666666]">{order.id}</span>
            </p>
          </div>
        </div>

        <div className="text-right space-y-1.5">
          <div className="inline-block bg-[#F4F4F2] border border-[#BBBFCA] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
            Fulfillment: {order.status}
          </div>
          <p className="text-[#495464]">
            Date: <span className="font-mono font-medium text-[#111111]">{formattedDate}</span>
          </p>
          <p className="text-[#495464]">
            Payment Method:{" "}
            <span className="font-semibold uppercase text-[#111111]">
              {order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : (order.paymentMethod || "Electronic / Card").toUpperCase()}
            </span>
          </p>
          <p className="text-[#495464]">
            Payment Status:{" "}
            <span
              className={`font-semibold uppercase ${
                order.paymentStatus === "PAID"
                  ? "text-emerald-800"
                  : order.paymentStatus === "FAILED"
                  ? "text-red-700"
                  : "text-amber-700"
              }`}
            >
              {order.paymentStatus || "PENDING"}
            </span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Customer & Delivery Destination Details                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-6 bg-[#F4F4F2] border border-[#BBBFCA]/60 p-4 mb-6">
        {/* Shipping Destination */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#495464] block border-b border-[#BBBFCA]/60 pb-1">
            Shipping Destination (Client)
          </span>
          <p className="font-semibold text-sm text-[#111111]">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p className="text-[#363E4B] leading-relaxed">
            {order.shippingAddress.address}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
            {order.shippingAddress.postalCode}
          </p>
          <div className="pt-1 text-[11px] text-[#495464] space-y-0.5">
            <p>
              <strong>Phone:</strong> {order.shippingAddress.phone || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {order.shippingAddress.email}
            </p>
          </div>
        </div>

        {/* Merchant & Order Context */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#495464] block border-b border-[#BBBFCA]/60 pb-1">
            Merchant &amp; Dispatch Division
          </span>
          <p className="font-semibold text-sm text-[#111111]">
            SHOPY Online Flagship Atelier
          </p>
          <p className="text-[#363E4B] leading-relaxed">
            Order Fulfillment &amp; Quality Dispatch Division
            <br />
            Nationwide Logistics Operations
          </p>
          <div className="pt-1 text-[11px] text-[#495464] space-y-0.5">
            <p>
              <strong>Customer Ref:</strong> {order.userId || "Guest Checkout"}
            </p>
            <p>
              <strong>Billing Address:</strong> Same as delivery address
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Ordered Pieces Table                                                   */}
      {/* ========================================================================= */}
      <div className="space-y-2 mb-6">
        <span className="text-xs uppercase tracking-widest font-bold text-[#111111] block">
          Ordered Pieces &amp; Specifications ({order.items.length} {order.items.length === 1 ? "Item" : "Items"})
        </span>

        <table className="w-full text-left border-collapse border border-[#111111]">
          <thead className="bg-[#111111] text-[#F4F4F2] uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2.5 font-semibold w-14 text-center border border-[#111111]">Piece</th>
              <th className="p-2.5 font-semibold border border-[#111111]">Description &amp; Specifications</th>
              <th className="p-2.5 font-semibold text-center border border-[#111111]">SKU / ID</th>
              <th className="p-2.5 font-semibold text-center border border-[#111111]">Qty</th>
              <th className="p-2.5 font-semibold text-right border border-[#111111]">Unit Price</th>
              <th className="p-2.5 font-semibold text-right border border-[#111111]">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#BBBFCA]/50">
            {order.items.map((item, idx) => {
              const itemKey = item.id || `item_${idx}`;
              const hasImgError = imageErrors[itemKey];
              const rawImg = item.image || "/editorial-craft.jpg";
              const fallbackImg = "/editorial-craft.jpg";

              return (
                <tr key={idx} className="border-b border-[#BBBFCA]/40">
                  {/* Thumbnail */}
                  <td className="p-2 text-center align-middle border border-[#BBBFCA]/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={hasImgError ? fallbackImg : rawImg}
                      alt={item.name}
                      onError={() => setImageErrors((prev) => ({ ...prev, [itemKey]: true }))}
                      className="w-10 h-12 object-cover object-center mx-auto border border-[#BBBFCA]/60 bg-[#E8E8E8]"
                    />
                  </td>

                  {/* Description */}
                  <td className="p-2.5 align-middle border border-[#BBBFCA]/40">
                    <p className="font-serif font-semibold text-sm text-[#111111]">{item.name}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-[#495464] mt-0.5 font-mono uppercase">
                      {item.size && (
                        <span className="bg-[#E8E8E8] px-1.5 py-0.5 font-medium">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="bg-[#E8E8E8] px-1.5 py-0.5 font-medium">
                          Color: {item.color}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="p-2.5 text-center align-middle font-mono text-[10px] text-[#495464] border border-[#BBBFCA]/40">
                    {item.productId ? item.productId.substring(0, 14) : "N/A"}
                  </td>

                  {/* Quantity */}
                  <td className="p-2.5 text-center align-middle font-mono font-semibold text-sm text-[#111111] border border-[#BBBFCA]/40">
                    {item.quantity}
                  </td>

                  {/* Unit Price */}
                  <td className="p-2.5 text-right align-middle font-mono text-xs text-[#363E4B] border border-[#BBBFCA]/40">
                    {formatPrice(item.price)}
                  </td>

                  {/* Line Total */}
                  <td className="p-2.5 text-right align-middle font-mono font-semibold text-xs text-[#111111] border border-[#BBBFCA]/40">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 4. Financial Summary & Customer Notes                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Customer Notes & Authenticity Notice */}
        <div className="col-span-7 space-y-3">
          {order.notes && (
            <div className="bg-[#F4F4F2] border border-[#BBBFCA]/60 p-3 text-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#111111] block">
                Customer Instructions / Delivery Notes:
              </span>
              <p className="text-[#363E4B] italic">&ldquo;{order.notes}&rdquo;</p>
            </div>
          )}

          <div className="border border-[#BBBFCA]/60 p-3 space-y-1 text-[10px] text-[#495464] leading-relaxed bg-[#FAFAFA]">
            <p className="font-semibold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
              SHOPY Quality Guarantee &amp; Return Policy
            </p>
            <p>
              All pieces are inspected and dispatched under strict atelier quality assurance. Returns &amp; exchanges
              are welcomed within 14 days of delivery with original tags intact. For concierge inquiries, email{" "}
              <strong>concierge@shopy.com</strong>.
            </p>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="col-span-5 bg-[#F4F4F2] border border-[#111111] p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-[#495464]">
            <span>Items Subtotal:</span>
            <span className="font-mono font-medium text-[#111111]">{formatPrice(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between items-center text-emerald-800 font-medium">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Applied Discount:
              </span>
              <span className="font-mono">-{formatPrice(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[#495464]">
            <span>Insured Nationwide Shipping:</span>
            <span className="font-mono font-medium text-[#111111]">
              {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[#495464]">
            <span>Applicable Taxes / GST:</span>
            <span className="font-mono text-[10px] text-[#666666]">Included in Total</span>
          </div>

          <div className="pt-2 border-t-2 border-[#111111] flex justify-between items-baseline">
            <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#111111]">
              Grand Total:
            </span>
            <span className="font-serif text-xl font-bold text-[#111111] tracking-tight">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Document Footer Stamp                                                  */}
      {/* ========================================================================= */}
      <div className="border-t border-[#BBBFCA]/60 pt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-[#666666]">
        <p>SHOPY ATELIER • ALL RIGHTS RESERVED • OFFICIAL ORDER INVOICE</p>
        <p className="font-mono">VERIFIED DISPATCH • ID: {order.id}</p>
      </div>
    </div>
  );
}
