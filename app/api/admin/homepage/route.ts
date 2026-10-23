import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db, SchemaNotReadyError } from "@/lib/db/store";
import { revalidatePath } from "next/cache";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const config = await db.getHomepageConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Failed to retrieve homepage config." }, { status: 500 });
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

  // Store Pages guard: the editable Collections title (when present) must be
  // a short string. Full-config saves without it are unchanged.
  if (body.collectionsTitle !== undefined && body.collectionsTitle !== null) {
    if (typeof body.collectionsTitle !== "string" || body.collectionsTitle.trim().length > 100) {
      return NextResponse.json(
        { error: "Collections title must be 100 characters or fewer." },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await db.updateHomepageConfig(body);

    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/collections");
    } catch {}

    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return NextResponse.json(
        {
          error: err.transient
            ? "The collections title is temporarily unavailable. Please retry."
            : "The collections title is not enabled yet. Run the store-pages database migration first.",
        },
        { status: 503 }
      );
    }
    console.error("[HOMEPAGE API PATCH ERROR]", err);
    return NextResponse.json({ error: "Failed to update homepage configuration." }, { status: 500 });
  }
}
