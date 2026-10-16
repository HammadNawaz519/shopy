import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

// Public homepage configuration: 5-min CDN cache, 10-min stale-while-revalidate
export const revalidate = 300;

// Public route: CORS-enabled so the APK instant-launch shell can refresh its
// landing data against the live app (no credentials involved).
export async function OPTIONS() {
  return corsPreflightResponse("GET");
}

export async function GET() {
  try {
    const config = await db.getHomepageConfig();
    return withPublicCors(
      NextResponse.json(
        { config },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      )
    );
  } catch {
    return withPublicCors(
      NextResponse.json(
        { error: "Failed to retrieve homepage configuration." },
        { status: 500 }
      )
    );
  }
}
