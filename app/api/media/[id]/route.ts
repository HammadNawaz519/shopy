import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

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
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("[GET MEDIA ROUTE ERROR]", error);
    return new NextResponse("Internal Media Error", { status: 500 });
  }
}
