import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

// Short in-memory server cache (10 seconds) to avoid spamming Postgres if multiple admin tabs/components mount simultaneously
let cachedStorageMetrics: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 1000;

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const now = Date.now();
  if (!forceRefresh && cachedStorageMetrics && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      storage: cachedStorageMetrics,
      cached: true,
    });
  }

  try {
    const storage = await db.getStorageMetrics();
    cachedStorageMetrics = storage;
    lastFetchTime = Date.now();

    return NextResponse.json({
      success: true,
      storage,
      cached: false,
    });
  } catch (error: any) {
    console.error("[ADMIN STORAGE API ERROR]", error);
    return NextResponse.json(
      { error: "Failed to retrieve storage metrics." },
      { status: 500 }
    );
  }
}
