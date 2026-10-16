import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public route: CORS-enabled so the APK instant-launch shell can refresh
// its navigation links against the live app (no credentials involved).
export async function OPTIONS() {
  return corsPreflightResponse("GET");
}

export async function GET() {
  try {
    const navigation = await db.getNavigationItems(true);
    return withPublicCors(
      NextResponse.json(
        { navigation: navigation || [] },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      )
    );
  } catch {
    return withPublicCors(
      NextResponse.json(
        { error: "Failed to retrieve navigation items." },
        { status: 500 }
      )
    );
  }
}
