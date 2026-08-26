import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const summary = await db.getAdminMetricsSummary();
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("[ADMIN METRICS API ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve metrics summary." },
      { status: 500 }
    );
  }
}
