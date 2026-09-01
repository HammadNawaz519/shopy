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
  const limitParam = searchParams.get("limit");
  const pageParam = searchParams.get("page");
  const offsetParam = searchParams.get("offset");

  const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10))) : undefined;
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : limit ? (page - 1) * limit : undefined;

  try {
    const customers = await db.getCustomersSummary(search, { limit, offset });
    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit: limit || customers.length,
        totalReturned: customers.length,
        hasMore: limit ? customers.length === limit : false,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN CUSTOMERS API ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve customer summary." },
      { status: 500 }
    );
  }
}
