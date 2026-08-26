import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { getCurrentUser } from "@/lib/security/session";
import { sanitizeString } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews?productId=...&sort=newest|highest|lowest&limit=10&offset=0
 * Retrieves approved customer reviews and real-time rating aggregations for a product.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId")?.trim();
    const sort = (searchParams.get("sort") || "newest") as "newest" | "highest" | "lowest";
    const limit = searchParams.get("limit") ? Math.min(50, Math.max(1, parseInt(searchParams.get("limit")!, 10))) : 20;
    const offset = searchParams.get("offset") ? Math.max(0, parseInt(searchParams.get("offset")!, 10)) : 0;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const [reviews, summary] = await Promise.all([
      db.getReviews({
        productId,
        status: "approved",
        sort,
        limit,
        offset,
      }),
      db.getProductRatingSummary(productId),
    ]);

    return NextResponse.json({
      reviews,
      summary,
      hasMore: reviews.length === limit,
    });
  } catch (err) {
    console.error("[GET REVIEWS ERROR]", err);
    return NextResponse.json(
      { error: "Failed to retrieve product reviews." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Creates a verified purchase review.
 * Enforces strict authentication, order ownership, order DELIVERED lifecycle state, and product presence.
 */
export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to submit a verified review." },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { productId, orderId, orderItemId, rating, comment } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Associated Order ID is required for verification." }, { status: 400 });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    const cleanComment = sanitizeString(comment || "");
    if (cleanComment.length < 3) {
      return NextResponse.json(
        { error: "Please provide a review of at least 3 characters." },
        { status: 400 }
      );
    }

    if (cleanComment.length > 1000) {
      return NextResponse.json(
        { error: "Review cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    // 3. Strict Server-Side Verification of Order & Delivery
    const order = await db.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "The specified order could not be located." },
        { status: 404 }
      );
    }

    // Must belong to the authenticated user (check by userId or customer email)
    const isOwner =
      (order.userId && order.userId === session.userId) ||
      (order.shippingAddress?.email && order.shippingAddress.email.toLowerCase().trim() === session.email.toLowerCase().trim());

    if (!isOwner && session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: You can only review products from your own orders." },
        { status: 403 }
      );
    }

    // Strictly enforce DELIVERED status
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        {
          error: `Reviews are only available after your order has been delivered. Current order status: ${order.status}.`,
        },
        { status: 403 }
      );
    }

    // Verify order contains the product
    const orderItem = (order.items || []).find(
      (it: any) => it.productId === productId || it.id === orderItemId
    );

    if (!orderItem) {
      return NextResponse.json(
        { error: "This product was not found in the specified delivered order." },
        { status: 400 }
      );
    }

    // 4. Duplicate Check: One review per customer per product
    const existingReview = await db.getUserProductReview(session.userId, productId);
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this piece." },
        { status: 409 }
      );
    }

    // 5. Create Verified Review in Database
    const productName = orderItem.name || "SHOPY Creation";
    const customerDisplayName = session.name ? session.name.trim() : "Verified Client";

    const review = await db.createVerifiedReview({
      productId,
      productName,
      userId: session.userId,
      orderId: order.id,
      orderItemId: orderItem.id,
      customerName: customerDisplayName,
      customerEmail: session.email,
      rating: numRating,
      comment: cleanComment,
    });

    // 6. Fetch updated rating aggregation
    const updatedSummary = await db.getProductRatingSummary(productId);

    return NextResponse.json(
      {
        success: true,
        message: "Your review has been verified and published.",
        review,
        summary: updatedSummary,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST REVIEW ERROR]", err);
    return NextResponse.json(
      { error: "Failed to submit review. Please try again later." },
      { status: 500 }
    );
  }
}
