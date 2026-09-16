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
          // Navigation is public and changes rarely; 10-min CDN cache, 1-hour SWR.
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
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
