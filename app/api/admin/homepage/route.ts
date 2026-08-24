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

  try {
    const body = await req.json();
    const updated = await db.updateHomepageConfig(body);

    try {
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true, config: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update homepage configuration." }, { status: 500 });
  }
}
