import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const revalidate = 300; // 5 minutes Edge CDN cache with on-demand admin revalidation

export async function GET() {
  try {
    const navigation = await db.getNavigationItems(true);
    return NextResponse.json(
      { navigation: navigation || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
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
