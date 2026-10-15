import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return NextResponse.json({ error: "oauth_not_configured" }, { status: 503 });
  return NextResponse.json({ clientId });
}
