import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";
import { revalidatePath } from "next/cache";

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
    const { name, description, image, tagline, featured } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const newCat = await db.addCategory({
      name,
      slug,
      tagline: tagline || `Editorial collection of ${name.toLowerCase()}`,
      description: description || `Curated ${name.toLowerCase()} for the contemporary wardrobe.`,
      image: image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
      featured: Boolean(featured),
    });

    try {
      revalidatePath("/");
      revalidatePath("/collections");
      revalidatePath("/products");
    } catch {}

    return NextResponse.json({ success: true, category: newCat }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, description, image, tagline, featured } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
    }

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : undefined;
    const updated = await db.updateCategory(id, {
      name,
      slug,
      description,
      image,
      tagline,
      featured,
    });

    if (!updated) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    try {
      revalidatePath("/");
      revalidatePath("/collections");
      revalidatePath("/products");
    } catch {}

    return NextResponse.json({ success: true, category: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
    }

    const result = await db.deleteCategory(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Cannot delete category." }, { status: 400 });
    }

    try {
      revalidatePath("/");
      revalidatePath("/collections");
      revalidatePath("/products");
      revalidatePath("/admin/categories");
      revalidatePath("/admin/products");
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete category." }, { status: 500 });
  }
}
