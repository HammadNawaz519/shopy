import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const discounts = await db.getDiscounts();
  return NextResponse.json({ discounts });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, type, value, minOrder, active } = body;

    if (!code || !value) {
      return NextResponse.json({ error: "Code and discount value are required." }, { status: 400 });
    }

    const newDiscount = await db.addDiscount({
      code,
      type: type || "percentage",
      value: Number(value),
      minOrder: Number(minOrder || 0),
      active: active !== undefined ? Boolean(active) : true,
    });

    return NextResponse.json({ success: true, discount: newDiscount }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create discount coupon." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, code, ...updates } = body;

    const discountId = id || code;
    if (!discountId) {
      return NextResponse.json({ error: "Code or ID is required." }, { status: 400 });
    }

    const updated = await db.updateDiscount(discountId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, discount: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update discount." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || searchParams.get("code");

    if (!id) {
      return NextResponse.json({ error: "Code or ID is required." }, { status: 400 });
    }

    const success = await db.deleteDiscount(id);
    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ error: "Failed to delete discount." }, { status: 500 });
  }
}
