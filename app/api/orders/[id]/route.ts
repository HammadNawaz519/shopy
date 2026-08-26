import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeString } from "@/lib/security/sanitize";
import { getCurrentUser } from "@/lib/security/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
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

    // Strict Authorization & IDOR Protection
    if (order.userId) {
      const session = await getCurrentUser();
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required to access this order." },
          { status: 401 }
        );
      }
      if (session.userId !== order.userId && session.role !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized to access this order." },
          { status: 403 }
        );
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
