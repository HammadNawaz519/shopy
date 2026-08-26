import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  const admin = await getAdminUser();
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
