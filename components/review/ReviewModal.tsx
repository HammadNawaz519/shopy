"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, CheckCircle2, Loader2, ShieldCheck, Star } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import { useToast } from "@/context/ToastContext";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    image?: string;
    size?: string;
    color?: string;
  };
  orderId: string;
  orderNumber: string;
  orderItemId?: string;
  onSuccess?: (createdReview: any) => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  product,
  orderId,
  orderNumber,
  orderItemId,
  onSuccess,
}: ReviewModalProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) {
      showToast("Please write a review of at least 3 characters.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          orderId,
          orderItemId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to submit review.", "error");
        return;
      }

      setSubmitted(true);
      showToast("Review submitted successfully! Thank you.", "success");

      if (onSuccess) {
        onSuccess(data.review);
      }

      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch {
      showToast("Network error submitting review. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !submitting && onClose()}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#F4F4F2] text-[#495464] z-10 shadow-2xl border border-[#BBBFCA]/60 p-5 sm:p-7 overflow-hidden space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#BBBFCA]/40 pb-3.5">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#495464]/60 font-semibold block">
              Verified Client Evaluation
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#495464]">
              Review Atelier Piece
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 text-[#495464] hover:opacity-60 transition-opacity"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#E8E8E8] text-[#495464] border border-[#BBBFCA]/60 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 className="font-serif text-lg font-medium text-[#495464]">
              Thank You for Your Feedback
            </h4>
            <p className="text-xs text-[#495464]/70 tracking-wider">
              Your verified review has been published to the atelier gallery.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Product & Order Snapshot */}
            <div className="flex items-center gap-3.5 bg-[#E8E8E8]/70 border border-[#BBBFCA]/50 p-3">
              <div className="relative w-12 h-16 sm:w-14 sm:h-18 bg-[#F4F4F2] flex-shrink-0 overflow-hidden border border-[#BBBFCA]/40">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-serif text-[#495464]/60">
                    SHOPY
                  </div>
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="font-serif text-sm font-medium text-[#495464] truncate">
                  {product.name}
                </h4>
                {(product.size || product.color) && (
                  <p className="text-[10px] text-[#495464]/70 tracking-wider">
                    {product.size ? `Size: ${product.size}` : ""} {product.color ? `• Color: ${product.color}` : ""}
                  </p>
                )}
                <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-[#495464]/80 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Delivered Order {orderNumber}</span>
                </div>
              </div>
            </div>

            {/* Star Selection */}
            <div className="space-y-2 text-center py-2 bg-[#E8E8E8]/40 border border-[#BBBFCA]/30 p-3">
              <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#495464]">
                Your Rating
              </label>
              <div className="flex justify-center items-center">
                <StarRating
                  rating={rating}
                  size="lg"
                  interactive={true}
                  onChange={(val) => setRating(val)}
                />
              </div>
              <span className="text-[11px] font-medium text-[#495464]/80 tracking-wide block">
                {rating === 5 && "Exceptional • 5 of 5"}
                {rating === 4 && "Great Quality • 4 of 5"}
                {rating === 3 && "Satisfactory • 3 of 5"}
                {rating === 2 && "Could Be Improved • 2 of 5"}
                {rating === 1 && "Disappointed • 1 of 5"}
              </span>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="reviewComment"
                  className="block text-[10px] uppercase tracking-widest font-semibold text-[#495464]"
                >
                  Your Written Review
                </label>
                <span className="text-[10px] font-mono text-[#495464]/60">
                  {comment.length}/1000
                </span>
              </div>
              <textarea
                id="reviewComment"
                required
                rows={4}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on the fabric quality, silhouette, sizing, and atelier finish..."
                className="w-full bg-[#E8E8E8]/50 border border-[#BBBFCA] p-3 text-xs text-[#495464] placeholder-[#495464]/40 focus:outline-hidden focus:border-[#495464] resize-y tracking-normal"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#BBBFCA]/40">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 border border-[#BBBFCA] text-[#495464] text-[11px] uppercase tracking-widest hover:bg-[#E8E8E8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || comment.trim().length < 3}
                className="inline-flex items-center justify-center gap-2 bg-[#495464] text-[#F4F4F2] px-6 py-2.5 text-[11px] uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
