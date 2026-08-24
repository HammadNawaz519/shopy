import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const navigation = await db.getNavigationItems(true);
    return NextResponse.json(
      { navigation: navigation || [] },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve navigation items." },
      { status: 500 }
    );
  }
}
