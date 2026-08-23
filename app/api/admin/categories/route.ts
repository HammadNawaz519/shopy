import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const categories = await db.getCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, image } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const newCat = await db.addCategory({
      name,
      slug,
      tagline: body.tagline || `Editorial collection of ${name.toLowerCase()}`,
      description: description || `Curated ${name.toLowerCase()} for the contemporary wardrobe.`,
      image: image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
    });

    return NextResponse.json({ success: true, category: newCat }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
