"use client";

import React, { useEffect, useState } from "react";
import { Star, CheckCircle2, XCircle, Trash2, Loader2, MessageSquare } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import StarRating from "@/components/ui/StarRating";
import { useToast } from "@/context/ToastContext";

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingReview, setDeletingReview] = useState<{ id: string; authorName: string; comment: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      showToast("Failed to load customer reviews.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(`Review ${status}`, "success");
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } catch {
      showToast("Error updating review status.", "error");
    }
  };

  const handleOpenDeleteModal = (review: any) => {
    setDeletingReview({
      id: review.id,
      authorName: review.authorName || review.author_name || "Customer",
      comment: review.comment || "",
    });
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(deletingReview.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success !== false)) {
        setDeleteModalOpen(false);
        setDeletingReview(null);
        showToast("✓ Customer review deleted.", "success");
        setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
      } else {
        const safeError =
          typeof data.error === "string"
            ? data.error
            : "We couldn't delete this review right now. Please try again.";
        setDeleteError(safeError);
      }
    } catch {
      setDeleteError("A network error occurred while contacting the server. Please check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Client Feedback & Reviews"
        subtitle="Moderate Verified Customer Testimonials"
      />

      <main className="flex-1 p-6 lg:p-10 max-w-[1720px] w-full mx-auto space-y-6">
        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 p-4 lg:p-6 shadow-xs flex justify-between items-center">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#495464]">Product Reviews</h2>
            <p className="text-xs text-[#495464]/60">
              {reviews.length} total customer evaluations
            </p>
          </div>
        </div>

        <div className="bg-[#F4F4F2] border border-[#BBBFCA]/40 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#495464] mx-auto" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#495464]/60 uppercase tracking-widest">
              No reviews posted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tracking-wider">
                <thead className="bg-[#E8E8E8] border-b border-[#BBBFCA]/40 text-[#495464] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Rating</th>
                    <th className="p-4 font-semibold">Comment</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BBBFCA]/20">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-[#E8E8E8]/40 transition-colors">
                      <td className="p-4 font-medium text-[#495464]">
                        <span className="block">{r.productName}</span>
                        {r.orderId && (
                          <span className="font-mono text-[10px] text-[#495464]/60 block mt-0.5">
                            Order: {r.orderId}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block text-[#495464]">{r.customerName}</span>
                        <span className="text-[10px] text-[#495464]/60">{r.customerEmail}</span>
                        {r.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#495464] bg-[#E8E8E8] border border-[#BBBFCA]/60 px-1.5 py-0.2 mt-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <StarRating rating={r.rating} size="xs" />
                          <span className="font-mono text-[11px] font-semibold text-[#495464]">
                            {r.rating}★
                          </span>
                        </div>
                      </td>
                      <td className="p-4 max-w-sm text-[#495464] italic">
                        &ldquo;{r.comment}&rdquo;
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[9px] uppercase font-semibold tracking-wider ${
                            r.status === "approved"
                              ? "bg-[#E8E8E8] text-[#495464] border border-[#BBBFCA]"
                              : r.status === "rejected"
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-[#F4F4F2] text-[#495464]/60 border border-dashed border-[#BBBFCA]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {r.status !== "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "approved")}
                            className="p-1.5 text-[#495464] hover:bg-[#BBBFCA]/30 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "rejected")}
                            className="p-1.5 text-[#495464]/70 hover:text-red-700 hover:bg-[#BBBFCA]/30 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDeleteModal(r)}
                          className="p-1.5 text-[#495464] hover:text-black hover:bg-[#BBBFCA]/40 transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Custom Luxury Delete Review Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Remove Customer Review"
          description="Are you sure you want to permanently delete this customer review and rating?"
          entityName={deletingReview ? `${deletingReview.authorName}'s Review` : undefined}
          secondaryNote={deletingReview?.comment ? `"${deletingReview.comment.slice(0, 120)}${deletingReview.comment.length > 120 ? "..." : ""}"` : undefined}
          confirmLabel="Delete Review"
          cancelLabel="Cancel"
          isDanger={true}
          isLoading={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteModalOpen(false);
              setDeletingReview(null);
              setDeleteError(null);
            }
          }}
        />
      </main>
    </div>
  );
}
