import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/security/googleAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getGoogleOAuthConfig();
  if (!config.clientId) return NextResponse.json({ error: "oauth_not_configured" }, { status: 503 });
  // androidClientId (empty when not configured on the server yet): the
  // server client id for the in-app Android CredentialManager sign-in. The
  // button uses it as the native serverClientId and falls back to the
  // classic web OAuth flow when it is absent.
  return NextResponse.json({
    clientId: config.clientId,
    androidClientId: config.androidClientId || "",
  });
}
