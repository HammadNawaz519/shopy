import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeSearchQuery } from "@/lib/security/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public route: CORS-enabled so the APK instant-launch shell's search modal
// can query the live catalogue (no credentials involved).
export async function OPTIONS() {
  return corsPreflightResponse("GET");
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`search_${ip}`, { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return withPublicCors(
        NextResponse.json(
          { error: "Too many search requests. Please slow down." },
          { status: 429 }
        )
      );
    }

    const { searchParams } = new URL(req.url);
    const q = sanitizeSearchQuery(searchParams.get("q"));

    if (!q || q.length < 1) {
      return withPublicCors(NextResponse.json({ results: [], query: "" }));
    }

    const results = await db.getProducts({ search: q });
    return withPublicCors(
      NextResponse.json(
        { results: results.slice(0, 10), query: q },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          },
        }
      )
    );
  } catch {
    return withPublicCors(
      NextResponse.json(
        { error: "Search failed." },
        { status: 500 }
      )
    );
  }
}
