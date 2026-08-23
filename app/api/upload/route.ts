import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/security/session";
import { validateUploadedBuffer } from "@/lib/security/upload";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`upload_${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many upload attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Require authenticated session for uploads
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = validateUploadedBuffer(buffer, file.name, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // In production, stream to cloud bucket (e.g. S3/Cloudinary/R2). In dev, return safe virtual path
    return NextResponse.json({
      success: true,
      filename: validation.safeFilename,
      url: `/uploads/${validation.safeFilename}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Upload processing failed." },
      { status: 500 }
    );
  }
}
