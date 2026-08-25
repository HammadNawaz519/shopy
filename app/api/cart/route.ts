import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ items: [] });
    }
    const items = await db.getUserCart(user.userId);
    return NextResponse.json({ items: items || [] });
  } catch (err) {
    console.error("[GET /api/cart ERROR]", err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { items, merge } = body;
    let incomingItems = Array.isArray(items) ? items : [];

    if (merge) {
      const existing = await db.getUserCart(user.userId);
      const map = new Map<string, any>();

      for (const it of existing) {
        if (!it || !it.productId) continue;
        const key = `${it.productId}_${it.size || ""}_${it.color || ""}`;
        map.set(key, { ...it });
      }

      for (const it of incomingItems) {
        if (!it || !it.productId) continue;
        const key = `${it.productId}_${it.size || ""}_${it.color || ""}`;
        if (map.has(key)) {
          const cur = map.get(key);
          cur.quantity = Math.max(cur.quantity, it.quantity);
        } else {
          map.set(key, { ...it });
        }
      }

      incomingItems = Array.from(map.values());
    }

    await db.saveUserCart(user.userId, incomingItems);
    return NextResponse.json({ success: true, items: incomingItems });
  } catch (err) {
    console.error("[POST /api/cart ERROR]", err);
    return NextResponse.json({ success: false, error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await db.clearUserCart(user.userId);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/cart ERROR]", err);
    return NextResponse.json({ success: true });
  }
}
