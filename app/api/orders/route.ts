import { NextResponse } from "next/server";
import { CheckoutSchema } from "@/lib/security/validation";
import { db } from "@/lib/db/store";
import { getCurrentUser } from "@/lib/security/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`order_${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many order requests. Please wait a few moments." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = CheckoutSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { items, shippingAddress, paymentMethod, promoCode } = parseResult.data;

    // Zero-trust: Recalculate all totals server-side from Supabase PostgreSQL
    const recalculated = await db.recalculateCart(items, promoCode);
    if (recalculated.items.length === 0) {
      return NextResponse.json(
        { error: "No valid products in order." },
        { status: 400 }
      );
    }

    // Optional user association from session
    const session = await getCurrentUser();
    const userId = session ? session.userId : undefined;

    const order = await db.createOrder({
      userId,
      items: recalculated.items,
      subtotal: recalculated.subtotal,
      discount: recalculated.discount,
      shipping: recalculated.shipping,
      total: recalculated.total,
      paymentMethod,
      shippingAddress,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process order." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // IDOR Protection: only fetch current user's orders from PostgreSQL
    const orders = await db.getOrdersByUserId(session.userId);
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
