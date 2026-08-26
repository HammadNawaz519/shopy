import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin session required. Please make sure you are logged in." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    // Validate mime type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg", "image/heic"];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|avif|heic)$/i)) {
      return NextResponse.json(
        { error: "Please upload a valid image file (JPG, PNG, WebP, AVIF)." },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Super-Fast, Ultra-High Quality WebP pipeline with Sharp:
    // 1. Auto-orient based on EXIF
    // 2. High-performance resampling
    // 3. Crisp unsharp-mask definition
    // 4. Compact WebP compression (~35KB-75KB) for lightning-fast storefront loading
    const processedBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({
        width: 1400,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .sharpen({
        sigma: 1.0,
        m1: 0.8,
        m2: 2.0,
      })
      .webp({
        quality: 86,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const assetId = `med_${Date.now()}_${safeName.substring(0, 15)}`;
    const filename = `${assetId}.webp`;

    // 1. Persist directly to PostgreSQL database bucket (100% persistent on Vercel)
    const mediaUrl = await db.saveMediaAsset(assetId, filename, "image/webp", processedBuffer);

    // 2. Also write to local public/uploads directory if environment allows
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, filename), processedBuffer);
    } catch {
      // Ephemeral disk environments (like Vercel serverless) are safely caught
    }

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      filename,
      size: processedBuffer.length,
      message: "Image optimized, compressed with Sharp, and saved to PostgreSQL DB bucket.",
    });
  } catch (error: any) {
    console.error("[SHARP UPLOAD ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process and upload image." },
      { status: 500 }
    );
  }
}
