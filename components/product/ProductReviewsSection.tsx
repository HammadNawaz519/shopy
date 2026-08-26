"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Star, ShieldCheck, Loader2, MessageSquarePlus, Filter } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import ReviewModal from "@/components/review/ReviewModal";
import { ProductReview, ProductRatingSummary } from "@/lib/db/store";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productImage?: string;
}

export default function ProductReviewsSection({
  productId,
  productName,
  productImage,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductRatingSummary>({
    averageRating: 0,
    reviewCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [loading, setLoading] = useState(true);

  // Review eligibility for currently logged in customer
  const [eligibility, setEligibility] = useState<{
    authenticated: boolean;
    eligible: boolean;
    hasReviewed: boolean;
    orderId?: string;
    orderNumber?: string;
    orderItemId?: string;
    review?: any;
  }>({
    authenticated: false,
    eligible: false,
    hasReviewed: false,
  });

  const [modalOpen, setModalOpen] = useState(false);

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}&sort=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const res = await fetch(`/api/reviews/eligibility?productId=${encodeURIComponent(productId)}`);
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, [productId, sort]);

  useEffect(() => {
    checkEligibility();
  }, [productId]);

  const handleReviewCreated = (newReview: any) => {
    setReviews((prev) => [newReview, ...prev]);
    setEligibility((prev) => ({
      ...prev,
      eligible: false,
      hasReviewed: true,
      review: newReview,
    }));
    fetchReviewsData();
  };

  const totalReviews = summary.reviewCount;
  const avgScore = summary.averageRating || 0;

  return (
    <section id="ratings-and-reviews" className="mt-16 sm:mt-20 pt-10 border-t border-[#BBBFCA]/30 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#BBBFCA]/30 pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#495464]/60 font-semibold block mb-1">
            CLIENT EVALUATIONS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#495464]">
            Ratings &amp; Reviews
          </h2>
        </div>

        {/* Action: Write a review if eligible */}
        {eligibility.eligible && eligibility.orderId && eligibility.orderNumber && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#495464] text-[#F4F4F2] px-5 py-2.5 text-[11px] uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors self-start sm:self-auto shadow-xs"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Write a Verified Review</span>
          </button>
        )}
      </div>

      {/* Main Review Block: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Aggregated Rating Summary Card */}
        <div className="lg:col-span-4 bg-[#E8E8E8]/50 border border-[#BBBFCA]/40 p-5 sm:p-7 space-y-6">
          <div className="text-center space-y-2">
            <span className="font-serif text-4xl sm:text-5xl font-medium text-[#495464] block">
              {totalReviews > 0 ? avgScore.toFixed(1) : "0.0"}
            </span>
            <div className="flex justify-center">
              <StarRating rating={avgScore} size="md" />
            </div>
            <p className="text-xs text-[#495464]/70 tracking-wider">
              {totalReviews > 0
                ? `Based on ${totalReviews} verified client ${totalReviews === 1 ? "review" : "reviews"}`
                : "No client appraisals recorded yet"}
            </p>
          </div>

          {/* Star Rating Breakdown Bars */}
          <div className="space-y-2 pt-4 border-t border-[#BBBFCA]/30 text-xs">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star as keyof typeof summary.distribution] || 0;
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

              return (
                <div key={star} className="flex items-center gap-2 text-[11px] text-[#495464]">
                  <span className="w-8 font-mono text-[10px] text-[#495464]/80 flex items-center justify-end gap-0.5">
                    {star} <Star className="w-2.5 h-2.5 fill-[#495464] text-[#495464]" />
                  </span>
                  <div className="flex-1 h-2 bg-[#BBBFCA]/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#495464] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-9 text-right font-mono text-[10px] text-[#495464]/60">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Verified Guarantee Badge */}
          <div className="pt-4 border-t border-[#BBBFCA]/30 flex items-start gap-2.5 text-[11px] text-[#495464]/80">
            <ShieldCheck className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" />
            <span>
              100% verified evaluations from customers with delivered atelier orders.
            </span>
          </div>
        </div>

        {/* Right Column: Reviews List & Sorting */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sorting & Filter Controls */}
          {reviews.length > 0 && (
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#BBBFCA]/20">
              <span className="text-xs uppercase tracking-wider text-[#495464]/70 font-medium">
                {reviews.length} {reviews.length === 1 ? "Evaluation" : "Evaluations"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#495464]/60">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-[#F4F4F2] border border-[#BBBFCA] text-xs text-[#495464] px-2.5 py-1 font-medium focus:outline-hidden"
                >
                  <option value="newest">Most Recent</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="py-16 text-center text-[#495464]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#495464]" />
              <p className="text-xs tracking-wider uppercase mt-2">Loading appraisals...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 bg-[#E8E8E8]/30 border border-dashed border-[#BBBFCA]/60 p-6 text-center space-y-2">
              <p className="font-serif text-base text-[#495464]">No reviews for this piece yet.</p>
              <p className="text-xs text-[#495464]/70 tracking-wider">
                Be the first to review this atelier creation once your order has been delivered.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#E8E8E8]/30 border border-[#BBBFCA]/40 p-4 sm:p-6 space-y-3 transition-colors hover:bg-[#E8E8E8]/50"
                >
                  {/* Rating + Date Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <StarRating rating={rev.rating} size="sm" />
                    <span className="text-[10px] font-mono text-[#495464]/60 tracking-wider">
                      {new Date(rev.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-[13px] text-[#495464] leading-relaxed tracking-normal font-normal">
                    &ldquo;{rev.comment}&rdquo;
                  </p>

                  {/* Reviewer & Verified Purchase */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#BBBFCA]/20 text-xs">
                    <span className="font-medium text-[#495464]">{rev.customerName}</span>
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Purchase</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal for Eligible Customers */}
      {eligibility.eligible && eligibility.orderId && eligibility.orderNumber && (
        <ReviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          product={{
            id: productId,
            name: productName,
            image: productImage,
          }}
          orderId={eligibility.orderId}
          orderNumber={eligibility.orderNumber}
          orderItemId={eligibility.orderItemId}
          onSuccess={handleReviewCreated}
        />
      )}
    </section>
  );
}
