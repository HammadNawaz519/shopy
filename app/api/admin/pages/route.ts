import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db, SchemaNotReadyError, LandingPageConflictError } from "@/lib/db/store";
import { revalidatePath } from "next/cache";

/** Store Pages: admin CRUD for custom storefront landing pages.
 * Modeled on app/api/admin/navigation/route.ts — same auth/revalidation
 * conventions, with strict server-side validation on every mutation.
 * Error contract: 400 validation / 404 not found / 409 conflict /
 * 503 schema-not-ready / 500 unexpected. Human strings only. */

function schemaNotReadyResponse(err: SchemaNotReadyError) {
  const message = err.transient
    ? "Pages are temporarily unavailable. The database check failed — please retry."
    : err.message;
  return NextResponse.json({ error: message }, { status: 503 });
}

function revalidatePages() {
  try {
    revalidatePath("/");
    revalidatePath("/collections");
    revalidatePath("/pages");
  } catch {}
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const pages = await db.getLandingPages(false);
    return NextResponse.json({ pages });
  } catch (err) {
    console.error("[PAGES API GET ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch pages." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawBody = body.body !== undefined ? String(body.body ?? "") : "";

  if (!name) {
    return NextResponse.json({ error: "Page name is required." }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Page name must be 100 characters or fewer." }, { status: 400 });
  }
  if (rawBody.length > 2000) {
    return NextResponse.json({ error: "Page body must be 2000 characters or fewer." }, { status: 400 });
  }

  try {
    const page = await db.addLandingPage({ name, body: rawBody.trim() });
    revalidatePages();
    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (err) {
    if (err instanceof SchemaNotReadyError) return schemaNotReadyResponse(err);
    if (err instanceof LandingPageConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[PAGES API POST ERROR]", err);
    return NextResponse.json({ error: "Failed to create page." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Shape 1: reorder — must be a FULL permutation of the current page ids
  // (nothing may be omitted or duplicated).
  if (Array.isArray(body.orderIds)) {
    try {
      const current = await db.getLandingPages(false);
      const currentIds = current.map((p) => p.id);
      const provided = body.orderIds as unknown[];
      const validShape =
        provided.length === currentIds.length &&
        provided.every((id) => typeof id === "string" && id.length > 0) &&
        new Set(provided as string[]).size === provided.length &&
        provided.every((id) => currentIds.includes(id as string));

      if (!validShape) {
        return NextResponse.json(
          { error: "Reorder request must include every page exactly once." },
          { status: 400 }
        );
      }

      const success = await db.reorderLandingPages(provided as string[]);
      if (!success) {
        return NextResponse.json({ error: "Page order is empty." }, { status: 400 });
      }
      revalidatePages();
      return NextResponse.json({ success: true });
    } catch (err) {
      if (err instanceof SchemaNotReadyError) return schemaNotReadyResponse(err);
      console.error("[PAGES API REORDER ERROR]", err);
      return NextResponse.json({ error: "Failed to update page order." }, { status: 500 });
    }
  }

  // Shape 2: single-page update — strict allow-list. No `slug` key: slugs are
  // immutable after creation.
  const { id, name, body: pageBody, orderIndex, isActive } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Page ID is required." }, { status: 400 });
  }

  const updates: any = {};
  if (name !== undefined) {
    const cleanName = typeof name === "string" ? name.trim() : "";
    if (!cleanName || cleanName.length > 100) {
      return NextResponse.json(
        { error: "Page name must be 1–100 characters." },
        { status: 400 }
      );
    }
    updates.name = cleanName;
  }
  if (pageBody !== undefined) {
    const cleanBody = typeof pageBody === "string" ? pageBody.trim() : "";
    if (cleanBody.length > 2000) {
      return NextResponse.json(
        { error: "Page body must be 2000 characters or fewer." },
        { status: 400 }
      );
    }
    updates.body = cleanBody;
  }
  if (orderIndex !== undefined) {
    if (typeof orderIndex !== "number" || !Number.isInteger(orderIndex) || orderIndex < 0 || orderIndex > 999) {
      return NextResponse.json({ error: "Order index must be an integer between 0 and 999." }, { status: 400 });
    }
    updates.orderIndex = orderIndex;
  }
  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Active status must be a boolean." }, { status: 400 });
    }
    updates.isActive = isActive;
  }

  try {
    // Duplicate-name check (case-insensitive, excluding self) ⇒ 409.
    if (updates.name !== undefined) {
      const all = await db.getLandingPages(false);
      const duplicate = all.some((p) => p.id !== id && p.name.toLowerCase() === updates.name.toLowerCase());
      if (duplicate) {
        return NextResponse.json({ error: "A page with this name already exists." }, { status: 409 });
      }
    }

    const updated = await db.updateLandingPage(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }
    revalidatePages();
    return NextResponse.json({ success: true, page: updated });
  } catch (err) {
    if (err instanceof SchemaNotReadyError) return schemaNotReadyResponse(err);
    console.error("[PAGES API PATCH ERROR]", err);
    return NextResponse.json({ error: "Failed to update page." }, { status: 500 });
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
      return NextResponse.json({ error: "Page ID is required." }, { status: 400 });
    }

    const success = await db.deleteLandingPage(id);
    if (!success) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }
    revalidatePages();
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof SchemaNotReadyError) return schemaNotReadyResponse(err);
    console.error("[PAGES API DELETE ERROR]", err);
    return NextResponse.json({ error: "Failed to delete page." }, { status: 500 });
  }
}
