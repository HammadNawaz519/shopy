import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// Public catalog data: 10-min CDN cache, 1-hour stale-while-revalidate
export const revalidate = 600;

export async function GET() {
  try {
    const categories = await db.getCategories();
    return NextResponse.json(
      { categories: categories || [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve categories." },
      { status: 500 }
    );
  }
}
