import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const config = await db.getHomepageConfig();
    return NextResponse.json(
      { config },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve homepage configuration." },
      { status: 500 }
    );
  }
}
