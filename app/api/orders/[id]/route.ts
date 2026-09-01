import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db/store";
import { sanitizeString } from "@/lib/security/sanitize";
import { getCurrentUser } from "@/lib/security/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params?.id;
    if (!rawId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const decodedId = decodeURIComponent(rawId);
    const id = sanitizeString(decodedId);

    const order = await db.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const session = await getCurrentUser();
    const isAdmin = session?.role === "admin";

    // Strict Authorization & IDOR Protection:
    if (order.userId) {
      // Authenticated customer order
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required to access this order." },
          { status: 401 }
        );
      }
      if (session.userId !== order.userId && !isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized to access this order." },
          { status: 403 }
        );
      }
    } else {
      // Guest order authorization:
      // Allow if admin, or if guest placed the order in this session (cookie present),
      // or if verified with customer email (via query parameter or header)
      if (!isAdmin) {
        const cookieStore = cookies();
        const hasGuestCookie = cookieStore.has(`shopy_guest_order_${order.id}`) || cookieStore.has(`shopy_guest_order_${order.orderNumber}`);

        const url = new URL(req.url);
        const queryEmail = (url.searchParams.get("email") || req.headers.get("x-order-email") || "").trim().toLowerCase();
        const orderEmail = (order.shippingAddress?.email || "").trim().toLowerCase();
        const isEmailVerified = Boolean(queryEmail && orderEmail && queryEmail === orderEmail);

        if (!hasGuestCookie && !isEmailVerified) {
          return NextResponse.json(
            { error: "Unauthorized to view guest order. Customer verification required." },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("[GET ORDER BY ID ERROR]", err);
    return NextResponse.json(
      { error: "Failed to retrieve order." },
      { status: 500 }
    );
  }
}
