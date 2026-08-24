import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeSearchQuery } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = sanitizeSearchQuery(searchParams.get("search"));
    const featured = searchParams.get("featured") === "true";
    const tag = searchParams.get("tag") || undefined;
    const sort = searchParams.get("sort") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

    const products = await db.getProducts({
      category,
      search,
      featured: featured || undefined,
    });

    return NextResponse.json(
      { products: products || [], total: products?.length || 0 },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve products." },
      { status: 500 }
    );
  }
}
