import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/security/googleAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = getGoogleOAuthConfig().clientId;
  if (!clientId) return NextResponse.json({ error: "oauth_not_configured" }, { status: 503 });
  return NextResponse.json({ clientId });
}
