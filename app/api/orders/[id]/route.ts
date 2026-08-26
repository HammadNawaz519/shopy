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

    // Optional access control if order is tied to a user account
    if (order.userId) {
      try {
        const session = await getCurrentUser();
        // If logged in under a different account that is not admin, deny
        if (session && session.userId !== order.userId && session.role !== "admin") {
          return NextResponse.json(
            { error: "Unauthorized to access this order." },
            { status: 403 }
          );
        }
      } catch (authErr) {
        console.warn("[ORDER ACCESS AUTH CHECK WARNING]", authErr);
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
