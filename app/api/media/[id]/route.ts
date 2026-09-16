import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// Images are keyed by a UUID that is content-addressed — the same ID always
// returns the same bytes. Safe to cache immutably in the browser and CDN.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const asset = await db.getMediaAsset(id);
    if (!asset || !asset.data) {
      return new NextResponse("Media Asset Not Found", { status: 404 });
    }

    const buffer = Buffer.isBuffer(asset.data) ? asset.data : Buffer.from(asset.data);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mime_type || "image/webp",
        "Content-Length": String(buffer.length),
        // UUID-keyed assets are content-addressed: same id = same bytes, forever.
        // 1-year browser + CDN cache; stale-while-revalidate as safety net.
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
        "ETag": `"${id}"`,
        "Vary": "Accept",
      },
    });
  } catch (error: any) {
    console.error("[GET MEDIA ROUTE ERROR]", error);
    return new NextResponse("Internal Media Error", { status: 500 });
  }
}
