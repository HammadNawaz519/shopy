import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const discounts = db.getDiscounts();
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

    const newDiscount = db.addDiscount({
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
    const { code, ...updates } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    const updated = db.updateDiscount(code, updates);
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
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    const success = db.deleteDiscount(code);
    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ error: "Failed to delete discount." }, { status: 500 });
  }
}
