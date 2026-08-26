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
    const result = await db.getAdminAnalyticsSummary();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ADMIN ANALYTICS API ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate analytics summary." },
      { status: 500 }
    );
  }
}
