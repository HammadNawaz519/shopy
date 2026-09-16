import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// Public homepage configuration: 5-min CDN cache, 10-min stale-while-revalidate
export const revalidate = 300;

export async function GET() {
  try {
    const config = await db.getHomepageConfig();
    return NextResponse.json(
      { config },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve homepage configuration." },
      { status: 500 }
    );
  }
}
