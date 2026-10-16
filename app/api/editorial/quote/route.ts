import { NextResponse } from "next/server";
import { fetchEditorialMotivationQuote } from "@/lib/groq";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

// Public route: CORS-enabled so the APK instant-launch shell can refresh
// the editorial quote against the live app (no credentials involved).
export async function OPTIONS() {
  return corsPreflightResponse("GET");
}

export async function GET() {
  try {
    const quoteData = await fetchEditorialMotivationQuote();
    return withPublicCors(
      NextResponse.json(
        { success: true, data: quoteData },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      )
    );
  } catch (error) {
    console.error("Failed to generate quote:", error);
    return withPublicCors(
      NextResponse.json(
        {
          success: false,
          error: "Failed to generate motivation quote",
        },
        { status: 500 }
      )
    );
  }
}
