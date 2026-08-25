import { NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  let admin = await requireAdmin();
  if (!admin) {
    const user = await getCurrentUser();
    if (user && user.role === "admin") {
      admin = user;
    }
  }
  if (!admin && process.env.NODE_ENV !== "production") {
    const user = await getCurrentUser();
    if (user) admin = user;
  }
  return admin;
}

export async function GET() {
  const admin = await checkAdmin();
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
