import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/security/googleAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getGoogleOAuthConfig();
  if (!config.clientId) return NextResponse.json({ error: "oauth_not_configured" }, { status: 503 });
  // clientId is the Web OAuth client — Credential Manager's serverClientId.
  // androidClientId is optional extra token audience (Android-type client).
  return NextResponse.json({
    clientId: config.clientId,
    androidClientId: config.androidClientId || "",
    configured: Boolean(config.clientId && config.clientSecret),
  });
}
