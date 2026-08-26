import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const after = searchParams.get("after");
    const afterId = searchParams.get("afterId") || undefined;

    if (!after) {
      // First-time anchor or no timestamp provided: Return anchor metadata
      const latestAnchor = await db.getLatestOrderAnchor();
      return NextResponse.json({
        unseenCount: 0,
        orders: [],
        latestTimestamp: latestAnchor?.timestamp || new Date().toISOString(),
        latestId: latestAnchor?.id || null,
      });
    }

    const orders = await db.getUnseenOrders(after, afterId);
    const latestTimestamp = orders.length > 0 ? orders[0].createdAt : after;
    const latestId = orders.length > 0 ? orders[0].id : afterId;

    return NextResponse.json({
      unseenCount: orders.length,
      orders,
      latestTimestamp,
      latestId,
    });
  } catch (error) {
    console.error("[API UNSEEN ORDERS ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch unseen orders." }, { status: 500 });
  }
}
