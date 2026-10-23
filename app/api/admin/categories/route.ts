import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db, SchemaNotReadyError } from "@/lib/db/store";
import { revalidatePath } from "next/cache";

/** Store Pages: normalize + validate a category's custom-page link target.
 * null/"" ⇒ no target (standard collection page). A non-null target must be
 * the slug of an existing, ACTIVE landing page — assigning to a hidden or
 * unknown page is rejected. Returns the clean slug, or null. */
async function validateTargetPage(raw: unknown): Promise<string | null> {
  const clean = raw ? String(raw).trim() : "";
  if (!clean) return null;
  const activePages = await db.getLandingPages(true);
  const activeSlugs = new Set(activePages.map((p) => p.slug));
  if (!activeSlugs.has(clean)) {
    throw new TargetPageInvalidError();
  }
  return clean;
}

class TargetPageInvalidError extends Error {
  constructor() {
    super("Selected target page does not exist or is hidden.");
    this.name = "TargetPageInvalidError";
  }
}

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
    const { name, description, image, tagline, featured, targetPage } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    // Store Pages: where this collection's image/card links to
    // (null = standard collection page). Invalid targets ⇒ 400.
    let cleanTarget: string | null;
    try {
      cleanTarget = await validateTargetPage(targetPage);
    } catch (err) {
      if (err instanceof TargetPageInvalidError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const newCat = await db.addCategory({
      name,
      slug,
      tagline: tagline || `Editorial collection of ${name.toLowerCase()}`,
      description: description || `Curated ${name.toLowerCase()} for the contemporary wardrobe.`,
      image: image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
      featured: Boolean(featured),
      targetPage: cleanTarget,
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/collections");
      revalidatePath("/products");
    } catch {}

    return NextResponse.json({ success: true, category: newCat }, { status: 201 });
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return NextResponse.json(
        {
          error: err.transient
            ? "Custom-page linking is temporarily unavailable. Please retry."
            : "Custom-page linking is not enabled yet. Run the store-pages database migration first.",
        },
        { status: 503 }
      );
    }
    console.error("[CATEGORIES API POST ERROR]", err);
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
    const { id, name, description, image, tagline, featured, targetPage } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
    }

    // Store Pages: targetPage semantics — omitted = leave unchanged;
    // null/"" = clear the assignment; non-null = must be an active page.
    const hasTargetField = Object.prototype.hasOwnProperty.call(body, "targetPage");
    let targetUpdates: { targetPage?: string | null } = {};
    if (hasTargetField) {
      try {
        const cleanTarget = await validateTargetPage(targetPage);
        targetUpdates = { targetPage: cleanTarget };
      } catch (err) {
        if (err instanceof TargetPageInvalidError) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        throw err;
      }
    }

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : undefined;
    const updated = await db.updateCategory(id, {
      name,
      slug,
      description,
      image,
      tagline,
      featured,
      ...targetUpdates,
    });

    if (!updated) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/collections");
      revalidatePath("/products");
    } catch {}

    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return NextResponse.json(
        {
          error: err.transient
            ? "Custom-page linking is temporarily unavailable. Please retry."
            : "Custom-page linking is not enabled yet. Run the store-pages database migration first.",
        },
        { status: 503 }
      );
    }
    console.error("[CATEGORIES API PATCH ERROR]", err);
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
      revalidatePath("/", "layout");
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
