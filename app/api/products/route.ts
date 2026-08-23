import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeSearchQuery } from "@/lib/security/sanitize";

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

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve products." },
      { status: 500 }
    );
  }
}
