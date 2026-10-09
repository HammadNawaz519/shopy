import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";
import { revalidatePath } from "next/cache";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const navigation = await db.getNavigationItems(false);
    return NextResponse.json({ navigation });
  } catch {
    return NextResponse.json({ error: "Failed to fetch navigation items." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, href, orderIndex, isActive, categorySlug } = body;

    if (!name || !href) {
      return NextResponse.json({ error: "Name and link destination are required." }, { status: 400 });
    }

    const item = await db.addNavigationItem({
      name,
      href,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : 99,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      categorySlug: categorySlug || undefined,
    });

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
    } catch {}

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create navigation item." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (Array.isArray(body.orderIds)) {
      const success = await db.reorderNavigationItems(body.orderIds);
      if (!success) {
        return NextResponse.json({ error: "Navigation order is empty." }, { status: 400 });
      }
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Navigation item ID is required." }, { status: 400 });
    }

    const updated = await db.updateNavigationItem(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Navigation item not found." }, { status: 404 });
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
    } catch {}

    return NextResponse.json({ success: true, item: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update navigation item." }, { status: 500 });
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
      return NextResponse.json({ error: "Navigation item ID is required." }, { status: 400 });
    }

    const success = await db.deleteNavigationItem(id);

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
    } catch {}

    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ error: "Failed to delete navigation item." }, { status: 500 });
  }
}
