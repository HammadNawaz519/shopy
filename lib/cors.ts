/**
 * CORS support for the public, read-only SHOPY APIs.
 *
 * The Android Capacitor shell can call these relative `/api/*` endpoints
 * from its local WebView origin (APK asset fallback pages). The public GET
 * routes therefore answer with permissive CORS. The data they serve is
 * already public (no cookies, no credentials), which is why
 * `Access-Control-Allow-Origin: *` is safe here and no credentials
 * headers are ever needed.
 *
 * Only the public catalog/navigation/homepage/search routes opt in;
 * session-bearing routes (/api/auth/*, /api/cart, /api/orders, admin) are
 * intentionally left untouched.
 */
import { NextResponse } from "next/server";

export function publicCorsHeaders(methods = "GET"): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": `${methods}, OPTIONS`,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/** Merge CORS headers into any response (used on success AND error paths
 *  so a cross-origin caller can at least observe the status code). */
export function withPublicCors(
  response: NextResponse,
  methods = "GET"
): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", `${methods}, OPTIONS`);
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

/** Preflight answer for routes that also accept non-simple requests
 *  (e.g. the newsletter POST with a JSON body). */
export function corsPreflightResponse(methods = "GET"): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  for (const [key, value] of Object.entries(publicCorsHeaders(methods))) {
    response.headers.set(key, value);
  }
  return response;
}
