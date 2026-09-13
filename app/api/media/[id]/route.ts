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

    const etag = `"${asset.id}"`;
    const clientEtag = req.headers.get("if-none-match");

    // If client already has this version, return 304 instantly without re-sending payload
    if (clientEtag && clientEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "ETag": etag,
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }

    const buffer = Buffer.isBuffer(asset.data) ? asset.data : Buffer.from(asset.data);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mime_type || "image/webp",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=0, must-revalidate",
        "ETag": etag,
      },
    });
  } catch (error: any) {
    console.error("[GET MEDIA ROUTE ERROR]", error);
    return new NextResponse("Internal Media Error", { status: 500 });
  }
}
