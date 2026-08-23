import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  try {
    const categories = await db.getCategories();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve categories." },
      { status: 500 }
    );
  }
}
