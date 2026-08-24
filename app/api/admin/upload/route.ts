import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
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

    // Crystal-clear image processing pipeline using Sharp
    // 1. Auto-rotate based on EXIF
    // 2. High-quality resampling with Lanczos3
    // 3. Crisp unsharp-masking for ultra-high authenticity and definition
    // 4. Output as modern WebP with high quality
    const processedBuffer = await sharp(rawBuffer)
      .rotate() // Auto-orient according to EXIF
      .resize({
        width: 1600,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .sharpen({
        sigma: 1.2,
        m1: 0.8,
        m2: 2.2,
      })
      .webp({
        quality: 92,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer();

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const filename = `img_${Date.now()}_${safeName.substring(0, 20)}.webp`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, processedBuffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: processedBuffer.length,
      message: "Image processed & crystal-clarity enhanced with Sharp.",
    });
  } catch (error: any) {
    console.error("[SHARP UPLOAD ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process and upload image." },
      { status: 500 }
    );
  }
}
