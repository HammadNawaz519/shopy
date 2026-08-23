import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const reviews = await db.getReviews();
  return NextResponse.json({ reviews });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Review ID and status are required." }, { status: 400 });
    }

    const updated = await db.updateReviewStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update review status." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
    }

    const success = await db.deleteReview(id);
    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ error: "Failed to delete review." }, { status: 500 });
  }
}
