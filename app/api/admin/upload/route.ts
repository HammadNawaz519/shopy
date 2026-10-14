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

    // Hero uploads use fixed desktop/mobile crops so one source image cannot
    // distort between laptop and phone aspect ratios. Category banners and
    // product uploads keep their existing whole-image resize behavior.
    const uploadProfile = new URL(req.url).searchParams.get("fit");
    const isBanner = uploadProfile === "banner";
    const isHero = uploadProfile === "hero";
    const isHeroMobile = uploadProfile === "hero-mobile";

    // Super-Fast, Ultra-High Quality WebP pipeline with Sharp:
    // 1. Auto-orient based on EXIF
    // 2. High-performance resampling (fit:"inside" = keep the whole image,
    //    just cap it at the box — same framing behavior as the product path)
    // 3. Crisp unsharp-mask definition
    // 4. Compact WebP compression for lightning-fast storefront loading
    const oriented = sharp(rawBuffer).rotate();
    const processedBuffer = isHero || isHeroMobile
      ? await oriented
          .resize({
            width: isHero ? 2560 : 1440,
            height: isHero ? 1440 : 2560,
            fit: "cover",
            position: "centre",
          })
          .sharpen({ sigma: 1.0, m1: 0.6, m2: 2.0 })
          .webp({ quality: 95, effort: 5, smartSubsample: false })
          .toBuffer()
      : await oriented
          .resize(
            isBanner
              ? { width: 3840, height: 2160, fit: "inside", withoutEnlargement: true }
              : { width: 1400, height: 1600, fit: "inside", withoutEnlargement: true }
          )
          .sharpen(
            isBanner
              ? { sigma: 1.0, m1: 0.6, m2: 2.0 }
              : { sigma: 1.0, m1: 0.8, m2: 2.0 }
          )
          .webp({
            quality: isBanner ? 96 : 86,
            effort: isBanner ? 5 : 4,
            smartSubsample: isBanner ? false : true,
          })
          .toBuffer();

    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const assetId = `med_${Date.now()}_${safeName.substring(0, 15)}`;
    const filename = `${assetId}.webp`;

    if (isHero) {
      const mobileBuffer = await oriented
        .resize({
          width: 1440,
          height: 2560,
          fit: "cover",
          position: "centre",
        })
        .sharpen({ sigma: 1.0, m1: 0.7, m2: 2.0 })
        .webp({ quality: 95, effort: 5, smartSubsample: false })
        .toBuffer();
      const mobileId = `${assetId}_mobile`;
      const mobileFilename = `${mobileId}.webp`;
      const [desktopUrl, mobileUrl] = await Promise.all([
        db.saveMediaAsset(assetId, filename, "image/webp", processedBuffer),
        db.saveMediaAsset(mobileId, mobileFilename, "image/webp", mobileBuffer),
      ]);

      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        await Promise.all([
          fs.writeFile(path.join(uploadsDir, filename), processedBuffer),
          fs.writeFile(path.join(uploadsDir, mobileFilename), mobileBuffer),
        ]);
      } catch {
        // Ephemeral disk environments (like Vercel serverless) are safely caught
      }

      return NextResponse.json({
        success: true,
        url: desktopUrl,
        variants: { desktop: desktopUrl, mobile: mobileUrl },
        filename,
        size: processedBuffer.length + mobileBuffer.length,
        message: "Hero image optimized into separate desktop and mobile crops.",
      });
    }

    if (isHeroMobile) {
      const mobileId = `${assetId}_mobile`;
      const mobileFilename = `${mobileId}.webp`;
      const mobileUrl = await db.saveMediaAsset(
        mobileId,
        mobileFilename,
        "image/webp",
        processedBuffer
      );

      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(path.join(uploadsDir, mobileFilename), processedBuffer);
      } catch {
        // Ephemeral disk environments (like Vercel serverless) are safely caught
      }

      return NextResponse.json({
        success: true,
        url: mobileUrl,
        filename: mobileFilename,
        size: processedBuffer.length,
        message: "Mobile hero image optimized to a portrait crop.",
      });
    }

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
