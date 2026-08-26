"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Truck, Package, ArrowRight, Loader2, Star } from "lucide-react";
import ReviewModal from "@/components/review/ReviewModal";

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [activeReviewTarget, setActiveReviewTarget] = useState<{
    product: any;
    orderId: string;
    orderNumber: string;
    orderItemId?: string;
  } | null>(null);

  useEffect(() => {
    document.title = "Order Confirmed | SHOPY";
  }, []);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const [orderRes, reviewRes] = await Promise.all([
          fetch(`/api/orders/${encodeURIComponent(params.id)}`),
          fetch("/api/reviews/eligibility"),
        ]);

        if (orderRes.ok) {
          const data = await orderRes.json();
          setOrder(data.order);
        }

        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          if (Array.isArray(reviewData.reviewedProductIds)) {
            setReviewedProductIds(new Set(reviewData.reviewedProductIds));
          }
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

  const isBankTransfer = order.paymentMethod === "bank_transfer" || order.paymentMethod === "online";
  const isPaid = order.paymentStatus === "PAID";
  const isVerifying =
    order.status === "VERIFYING_PAYMENT" ||
    order.status === "AWAITING_PAYMENT_VERIFICATION" ||
    (isBankTransfer && !isPaid);

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center py-8 border-b border-[#BBBFCA]/30 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E8E8E8] text-[#495464] mb-2 border border-[#BBBFCA]/50 animate-fadeIn">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block font-medium">
            {isVerifying ? "PAYMENT VERIFICATION IN PROGRESS" : "CONFIRMED & ATELIER QUEUED"}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#495464]">
            Thank you for your order
          </h1>
          <p className="text-xs sm:text-sm text-[#495464]/80 tracking-wider max-w-md mx-auto">
            {isVerifying
              ? `We're verifying your payment for Order ${order.orderNumber}. Your order will be prepared once your payment has been confirmed.`
              : `Order ${order.orderNumber} has been confirmed and is currently being prepared in our atelier.`}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="mt-8 sm:mt-10 bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Tracking Step Tracker */}
          <div className="border-b border-[#BBBFCA]/30 pb-6">
            <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center">
              <div className="flex flex-col items-center space-y-1.5 px-0.5">
                <span
                  className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                    isVerifying ? "bg-amber-600 animate-pulse" : "bg-[#495464]"
                  }`}
                />
                <p className="text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-wider font-semibold text-[#495464] leading-tight text-center">
                  {isBankTransfer ? (isPaid ? "Verified" : "Verifying") : "Confirmed"}
                </p>
              </div>

              <div
                className={`flex flex-col items-center space-y-1.5 px-0.5 ${
                  order.status === "PREPARING" ||
                  order.status === "PROCESSING" ||
                  order.status === "SHIPPED" ||
                  order.status === "OUT_FOR_DELIVERY" ||
                  order.status === "DELIVERED"
                    ? ""
                    : "opacity-40"
                }`}
              >
                <span
                  className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                    order.status === "PREPARING" ||
                    order.status === "PROCESSING" ||
                    order.status === "SHIPPED" ||
                    order.status === "OUT_FOR_DELIVERY" ||
                    order.status === "DELIVERED"
                      ? "bg-[#495464]"
                      : "bg-[#BBBFCA]"
                  }`}
                />
                <p className="text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-wider font-medium text-[#495464] leading-tight text-center">
                  Preparing
                </p>
              </div>

              <div
                className={`flex flex-col items-center space-y-1.5 px-0.5 ${
                  order.status === "SHIPPED" ||
                  order.status === "OUT_FOR_DELIVERY" ||
                  order.status === "DELIVERED"
                    ? ""
                    : "opacity-40"
                }`}
              >
                <span
                  className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                    order.status === "SHIPPED" ||
                    order.status === "OUT_FOR_DELIVERY" ||
                    order.status === "DELIVERED"
                      ? "bg-[#495464]"
                      : "bg-[#BBBFCA]"
                  }`}
                />
                <p className="text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-wider font-medium text-[#495464] leading-tight text-center">
                  In Transit
                </p>
              </div>

              <div
                className={`flex flex-col items-center space-y-1.5 px-0.5 ${
                  order.status === "DELIVERED" ? "" : "opacity-40"
                }`}
              >
                <span
                  className={`inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                    order.status === "DELIVERED" ? "bg-emerald-700" : "bg-[#BBBFCA]"
                  }`}
                />
                <p className="text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-wider font-medium text-[#495464] leading-tight text-center">
                  Delivered
                </p>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#495464]">
              Ordered Items ({order.items.length})
            </h3>
            <div className="divide-y divide-[#BBBFCA]/20">
              {order.items.map((item: any, idx: number) => {
                const isDelivered = order.status === "DELIVERED";
                const hasReviewed = item.productId && reviewedProductIds.has(item.productId);

                return (
                  <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-14 bg-[#E8E8E8] flex-shrink-0 overflow-hidden">
                        <Image
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif text-xs sm:text-sm font-medium text-[#495464] truncate">{item.name}</h4>
                        <p className="text-[10px] text-[#495464]/60 tracking-wider">
                          Qty: {item.quantity} • {item.size} • {item.color}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                      <span className="text-xs font-medium text-[#495464]">
                        {formatPrice(item.price * item.quantity)}
                      </span>

                      {/* Review Action (DELIVERED status only) */}
                      {isDelivered && (
                        <div>
                          {hasReviewed ? (
                            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold text-[#495464] bg-[#E8E8E8] border border-[#BBBFCA]/60 px-2.5 py-1">
                              <CheckCircle2 className="w-3 h-3 text-[#495464]" />
                              <span>Reviewed</span>
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                setActiveReviewTarget({
                                  product: {
                                    id: item.productId,
                                    name: item.name,
                                    image: item.image,
                                    size: item.size,
                                    color: item.color,
                                  },
                                  orderId: order.id,
                                  orderNumber: order.orderNumber,
                                  orderItemId: item.id,
                                })
                              }
                              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[#F4F4F2] bg-[#495464] hover:bg-[#363E4B] px-3 py-1 transition-colors shadow-xs"
                            >
                              <Star className="w-3 h-3 fill-[#F4F4F2]" />
                              <span>Review</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
              <span>Grand Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Shipping Destination & Payment Info */}
          <div className="border-t border-[#BBBFCA]/30 pt-4 text-xs tracking-wider text-[#495464]/80 space-y-4">
            <div>
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#495464]">
                  Payment Method:
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 border bg-[#E8E8E8] text-[#495464] border-[#BBBFCA]">
                  {isBankTransfer ? "Bank Transfer" : "Cash on Delivery"}
                </span>
              </div>
            </div>

            {/* Online Bank Transfer Details */}
            {isBankTransfer && order.paymentDetails && (
              <div className="bg-[#E8E8E8]/70 border border-[#BBBFCA]/50 p-4 space-y-2 text-xs">
                <span className="font-semibold block uppercase text-[10px] tracking-widest text-[#495464]">
                  Bank Transfer Reference Details:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#495464]">
                  <div>
                    <span className="text-[#495464]/70">Bank:</span>{" "}
                    <strong>{order.paymentDetails.bankName || "Meezan Bank Limited"}</strong>
                  </div>
                  <div>
                    <span className="text-[#495464]/70">Account Holder:</span>{" "}
                    <span>{order.paymentDetails.accountHolderName}</span>
                  </div>
                  {order.paymentDetails.accountTitle && (
                    <div>
                      <span className="text-[#495464]/70">Account Title:</span>{" "}
                      <span>{order.paymentDetails.accountTitle}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#495464]/70">Account #:</span>{" "}
                    <span className="font-mono font-bold">{order.paymentDetails.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#495464]/70">IBAN:</span>{" "}
                    <span className="font-mono font-bold">{order.paymentDetails.iban}</span>
                  </div>
                  {order.paymentDetails.raastId && (
                    <div>
                      <span className="text-[#495464]/70">Raast ID:</span>{" "}
                      <span className="font-mono font-bold">{order.paymentDetails.raastId}</span>
                    </div>
                  )}
                </div>
                {order.paymentDetails.instructions && (
                  <p className="text-[10px] text-[#495464]/80 pt-2 border-t border-[#BBBFCA]/30">
                    {order.paymentDetails.instructions}
                  </p>
                )}
                {order.paymentDetails.paymentContact && (
                  <p className="text-[10px] text-[#495464] font-medium">
                    Send screenshot on WhatsApp: <strong>{order.paymentDetails.paymentContact}</strong>
                  </p>
                )}
              </div>
            )}
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

      {/* Review Modal for Verified Delivered Orders */}
      {activeReviewTarget && (
        <ReviewModal
          isOpen={Boolean(activeReviewTarget)}
          onClose={() => setActiveReviewTarget(null)}
          product={activeReviewTarget.product}
          orderId={activeReviewTarget.orderId}
          orderNumber={activeReviewTarget.orderNumber}
          orderItemId={activeReviewTarget.orderItemId}
          onSuccess={(createdReview) => {
            if (createdReview?.productId) {
              setReviewedProductIds((prev) => new Set([...prev, createdReview.productId]));
            }
          }}
        />
      )}
    </div>
  );
}
