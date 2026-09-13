import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await db.getCategories();
    return NextResponse.json(
      { categories: categories || [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
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
