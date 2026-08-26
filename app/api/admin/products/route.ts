import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || undefined;

  const products = await db.getProducts({ category, search, sort });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, category, categoryLabel, price, originalPrice, description, images, sizes, colors, stockCount, tag, featured } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ error: "Name, category, and price are required." }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

    const newProduct = await db.addProduct({
      name,
      slug,
      category: typeof category === "string" ? category : category.slug,
      categoryLabel: categoryLabel || (typeof category === "string" ? category.toUpperCase() : category.name),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      description: description || "",
      images: validImages.length > 0 ? validImages : ["/editorial-craft.jpg"],
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
      colors: Array.isArray(colors) && colors.length > 0 ? colors : [{ name: "Obsidian Slate", hex: "#495464" }],
      stockCount: Number(stockCount !== undefined ? stockCount : 10),
      inStock: Number(stockCount !== undefined ? stockCount : 10) > 0,
      composition: ["100% Premium Fabric"],
      careInstructions: ["Dry Clean Only / Machine wash cold"],
      details: ["Signature Atelier craftsmanship"],
      tag: tag || "NEW",
      featured: Boolean(featured),
    });

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
    } catch {}

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN CREATE PRODUCT ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to create product." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const updated = await db.updateProduct(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
      revalidatePath(`/product/${id}`);
      if (updated.slug) revalidatePath(`/product/${updated.slug}`);
    } catch {}

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("[ADMIN UPDATE PRODUCT ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const result = await db.safeDeleteProduct(id);

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
      revalidatePath(`/product/${id}`);
      revalidatePath("/admin/products");
      revalidatePath("/admin/inventory");
    } catch {}

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ADMIN DELETE PRODUCT ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to delete product." }, { status: 500 });
  }
}
