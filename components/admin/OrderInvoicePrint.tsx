"use client";

import React, { useState } from "react";
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

  const paymentMethodLabel =
    order.paymentMethod === "cod"
      ? "Cash on Delivery (COD)"
      : order.paymentMethod === "bank_transfer" || order.paymentMethod === "online"
      ? "Bank Transfer / Raast"
      : order.paymentMethod
      ? order.paymentMethod.toUpperCase()
      : "Cash on Delivery (COD)";

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
            Order Receipt &amp; Packing Slip
          </p>
          <div className="mt-3 space-y-0.5 text-xs">
            <p className="text-[#495464]">
              Order Reference:{" "}
              <strong className="text-[#111111] font-mono text-sm font-semibold">
                {order.orderNumber}
              </strong>
            </p>
            <p className="text-[#495464]">
              Order Date: <span className="text-[#111111] font-medium">{formattedDate}</span>
            </p>
          </div>
        </div>

        <div className="text-right space-y-1 text-xs">
          <p className="text-[#495464]">
            Payment Method:{" "}
            <span className="font-semibold uppercase text-[#111111]">
              {paymentMethodLabel}
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
                  : "text-amber-800"
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
        {/* Delivery Destination */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#495464] block border-b border-[#BBBFCA]/60 pb-1">
            Deliver To
          </span>
          <p className="font-semibold text-sm text-[#111111] pt-0.5">
            {order.shippingAddress?.firstName || "Client"} {order.shippingAddress?.lastName || ""}
          </p>
          <p className="text-[#363E4B] leading-relaxed">
            {order.shippingAddress?.address || "Address unspecified"}
            <br />
            {order.shippingAddress?.city || "Pakistan"}{order.shippingAddress?.province ? `, ${order.shippingAddress.province}` : ""}{" "}
            {order.shippingAddress?.postalCode || ""}
          </p>
          <div className="pt-1 text-[11px] text-[#495464] space-y-0.5">
            <p>
              <strong>Phone (Payment / WhatsApp):</strong> {order.shippingAddress?.phone || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {order.shippingAddress?.email || "N/A"}
            </p>
          </div>
        </div>

        {/* Customer Support & Concierge Info */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#495464] block border-b border-[#BBBFCA]/60 pb-1">
            Customer Care &amp; Support
          </span>
          <p className="font-semibold text-sm text-[#111111] pt-0.5">
            SHOPY Client Concierge
          </p>
          <p className="text-[#363E4B] leading-relaxed">
            For questions regarding your order, sizing inquiries, or exchange requests, our team is at your service.
          </p>
          <div className="pt-1 text-[11px] text-[#495464] space-y-0.5">
            <p>
              <strong>Email:</strong> shopy.support@gmail.com
            </p>
            <p>
              <strong>Website:</strong> www.shopy.com
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Ordered Pieces Table                                                   */}
      {/* ========================================================================= */}
      <div className="space-y-2 mb-6">
        <span className="text-xs uppercase tracking-widest font-bold text-[#111111] block">
          Ordered Items ({order.items.length} {order.items.length === 1 ? "Piece" : "Pieces"})
        </span>

        <table className="w-full text-left border-collapse border border-[#111111]">
          <thead className="bg-[#111111] text-[#F4F4F2] uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2.5 font-semibold border border-[#111111]">Product</th>
              <th className="p-2.5 font-semibold border border-[#111111] w-32">Specifications</th>
              <th className="p-2.5 font-semibold text-center border border-[#111111] w-16">Qty</th>
              <th className="p-2.5 font-semibold text-right border border-[#111111] w-28">Unit Price</th>
              <th className="p-2.5 font-semibold text-right border border-[#111111] w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#BBBFCA]/50">
            {order.items.map((item, idx) => {
              const itemKey = item.id || `item_${idx}`;
              const hasImgError = imageErrors[itemKey];
              const showThumbnail = Boolean(item.image && !hasImgError);

              return (
                <tr key={idx} className="border-b border-[#BBBFCA]/40">
                  {/* Product Info with optional clean thumbnail */}
                  <td className="p-2.5 align-middle border border-[#BBBFCA]/40">
                    <div className="flex items-center gap-3">
                      {showThumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          onError={() => setImageErrors((prev) => ({ ...prev, [itemKey]: true }))}
                          className="w-10 h-12 object-cover object-center flex-shrink-0 border border-[#BBBFCA]/60 bg-[#E8E8E8]"
                        />
                      )}
                      <div>
                        <p className="font-serif font-semibold text-sm text-[#111111]">{item.name}</p>
                      </div>
                    </div>
                  </td>

                  {/* Specifications (Size & Color) */}
                  <td className="p-2.5 align-middle border border-[#BBBFCA]/40">
                    <div className="flex flex-col gap-1 text-[10px] text-[#495464] font-medium uppercase">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                      {!item.size && !item.color && <span className="text-[#888888]">Standard</span>}
                    </div>
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
        {/* Customer Notes & Return Information */}
        <div className="col-span-7 space-y-3">
          {order.notes && (
            <div className="bg-[#F4F4F2] border border-[#BBBFCA]/60 p-3 text-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#111111] block">
                Delivery Instructions:
              </span>
              <p className="text-[#363E4B] italic">&ldquo;{order.notes}&rdquo;</p>
            </div>
          )}

          <div className="border border-[#BBBFCA]/60 p-3 space-y-1 text-[10px] text-[#495464] leading-relaxed bg-[#FAFAFA]">
            <p className="font-semibold uppercase tracking-wider text-[#111111]">
              Returns &amp; Exchanges Policy
            </p>
            <p>
              We want you to love your pieces. If you need a size exchange or wish to initiate a return,
              please reach out to us at <strong>shopy.support@gmail.com</strong> within 14 days of receiving your order with your original tags attached.
            </p>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="col-span-5 bg-[#F4F4F2] border border-[#111111] p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-[#495464]">
            <span>Subtotal:</span>
            <span className="font-mono font-medium text-[#111111]">{formatPrice(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between items-center text-emerald-800 font-medium">
              <span>Discount Applied:</span>
              <span className="font-mono">-{formatPrice(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[#495464]">
            <span>Shipping:</span>
            <span className="font-mono font-medium text-[#111111]">
              {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
            </span>
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
        <p>SHOPY • OFFICIAL ORDER RECEIPT &amp; PACKING SLIP</p>
        <p>THANK YOU FOR YOUR PATRONAGE</p>
      </div>
    </div>
  );
}
