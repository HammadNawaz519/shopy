import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeString } from "@/lib/security/sanitize";
import { getCurrentUser } from "@/lib/security/session";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = sanitizeString(params.id);
    const order = await db.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // IDOR verification if order is tied to an account
    if (order.userId) {
      const session = await getCurrentUser();

      if (!session || (session.userId !== order.userId && session.role !== "admin")) {
        return NextResponse.json(
          { error: "Unauthorized to access this order." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve order." },
      { status: 500 }
    );
  }
}
