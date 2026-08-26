import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { getCurrentUser } from "@/lib/security/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews/eligibility?productId=...
 * Checks if the current authenticated user has purchased this product in a DELIVERED order
 * and whether they have already submitted a review.
 */
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        eligible: false,
        hasReviewed: false,
      });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId")?.trim();

    if (!productId) {
      // If no specific productId is passed, return list of all reviewed product IDs for this user
      const reviewedProductIds = await db.getUserReviewedProductIds(session.userId);
      return NextResponse.json({
        authenticated: true,
        reviewedProductIds,
      });
    }

    // Check if already reviewed
    const existingReview = await db.getUserProductReview(session.userId, productId);
    if (existingReview) {
      return NextResponse.json({
        authenticated: true,
        eligible: false,
        hasReviewed: true,
        review: existingReview,
      });
    }

    // Query user's orders to find a DELIVERED order containing this product
    const orders = await db.getOrdersByUserId(session.userId);
    const deliveredOrderWithProduct = orders.find((o) => {
      if (o.status !== "DELIVERED") return false;
      return (o.items || []).some((it: any) => it.productId === productId);
    });

    if (deliveredOrderWithProduct) {
      const orderItem = (deliveredOrderWithProduct.items || []).find((it: any) => it.productId === productId);
      return NextResponse.json({
        authenticated: true,
        eligible: true,
        hasReviewed: false,
        orderId: deliveredOrderWithProduct.id,
        orderNumber: deliveredOrderWithProduct.orderNumber,
        orderItemId: orderItem?.id,
      });
    }

    return NextResponse.json({
      authenticated: true,
      eligible: false,
      hasReviewed: false,
    });
  } catch (err) {
    console.error("[REVIEW ELIGIBILITY ERROR]", err);
    return NextResponse.json(
      { error: "Failed to check review eligibility." },
      { status: 500 }
    );
  }
}
