import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

/**
 * COD blocklist management (admin only).
 *
 * Emails in this list CANNOT place Cash on Delivery orders — /api/orders
 * rejects their COD attempts with a 403 "cod_blocked" so the checkout page
 * routes them to card payment. Card orders are NOT affected.
 *
 * GET  -> { emails: string[] }
 * POST { emails: string[] } -> replace the whole list -> { success, emails }
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }
  try {
    const emails = await db.getBlockedUserEmails();
    return NextResponse.json({ emails });
  } catch (error) {
    console.error("[BLOCKED USERS API ERROR]", error);
    return NextResponse.json({ error: "Failed to load blocked users." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmails: unknown = body.emails;
    if (!Array.isArray(rawEmails)) {
      return NextResponse.json({ error: "Body must be { emails: string[] }." }, { status: 400 });
    }
    const emails = await db.setBlockedUserEmails(rawEmails.map((e) => String(e)));
    return NextResponse.json({ success: true, emails });
  } catch (error) {
    console.error("[BLOCKED USERS API ERROR]", error);
    return NextResponse.json({ error: "Failed to update blocked users." }, { status: 500 });
  }
}
