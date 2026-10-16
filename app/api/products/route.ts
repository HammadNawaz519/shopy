import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeSearchQuery } from "@/lib/security/sanitize";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public route: CORS-enabled so the APK instant-launch shell can refresh its
// featured products against the live app (no credentials involved).
export async function OPTIONS() {
  return corsPreflightResponse("GET");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = sanitizeSearchQuery(searchParams.get("search"));
    const featured = searchParams.get("featured") === "true";

    const products = await db.getProducts({
      category,
      search,
      featured: featured || undefined,
    });

    return withPublicCors(
      NextResponse.json(
        { products: products || [], total: products?.length || 0 },
        {
          status: 200,
          headers: {
            // Public catalog data; 5-min CDN cache matches ISR revalidation window.
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      )
    );
  } catch {
    return withPublicCors(
      NextResponse.json(
        { error: "Failed to retrieve products." },
        { status: 500 }
      )
    );
  }
}
