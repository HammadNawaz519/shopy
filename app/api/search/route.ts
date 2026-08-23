import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeSearchQuery } from "@/lib/security/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`search_${ip}`, { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many search requests. Please slow down." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = sanitizeSearchQuery(searchParams.get("q"));

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [], query: "" });
    }

    const results = db.getProducts({ search: q });
    return NextResponse.json({ results: results.slice(0, 10), query: q });
  } catch {
    return NextResponse.json(
      { error: "Search failed." },
      { status: 500 }
    );
  }
}
