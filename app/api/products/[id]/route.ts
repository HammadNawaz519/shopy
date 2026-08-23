import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { sanitizeString } from "@/lib/security/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = sanitizeString(params.id);
    const product = await db.getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve product details." },
      { status: 500 }
    );
  }
}
