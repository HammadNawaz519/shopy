import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

// Public catalog data: 10-min CDN cache, 1-hour stale-while-revalidate
export const revalidate = 600;

// Public route: CORS-enabled so the APK instant-launch shell can refresh
// its category grid against the live app (no credentials involved).
export async function OPTIONS() {
  return corsPreflightResponse("GET");
}

export async function GET() {
  try {
    const categories = await db.getCategories();
    return withPublicCors(
      NextResponse.json(
        { categories: categories || [] },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
          },
        }
      )
    );
  } catch {
    return withPublicCors(
      NextResponse.json(
        { error: "Failed to retrieve categories." },
        { status: 500 }
      )
    );
  }
}
