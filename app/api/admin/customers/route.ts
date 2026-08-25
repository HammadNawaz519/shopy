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

export async function GET(req: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || undefined;

  try {
    const customers = await db.getCustomersSummary(search);
    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error("[ADMIN CUSTOMERS API ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve customer summary." },
      { status: 500 }
    );
  }
}
