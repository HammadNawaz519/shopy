import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/security/constants";

/**
 * SHOPY Edge Middleware — Vercel Edge Optimized
 *
 * Performance Characteristics:
 * - Zero execution for public pages, static assets, images, and API routes.
 * - Executes strictly for authenticated page access (/account/*, /admin/*) and guest auth flows (/login, /register).
 * - Zero database queries, external network calls, or heavy crypto at the Edge layer.
 * - Microsecond evaluation with single-hop deterministic redirects and open-redirect defense.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. Admin Route Protection: /admin and sub-routes require active session
  if (pathname.startsWith("/admin")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      const safeRedirect =
        pathname.startsWith("/") && !pathname.startsWith("//")
          ? `${pathname}${search}`
          : "/admin";
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Client Account Route Protection: /account and nested account pages
  if (pathname.startsWith("/account")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      const safeRedirect =
        pathname.startsWith("/") && !pathname.startsWith("//")
          ? `${pathname}${search}`
          : "/account";
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Guest Flow Optimization: Allow direct access to login/register without blocking
  return NextResponse.next();
}

/**
 * Strict Protected Route Matcher:
 * Ensures Vercel Edge ONLY executes middleware for genuinely protected private routes.
 * 100% of public pages, static assets, images, and public APIs bypass Edge Middleware.
 */
export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/account",
    "/account/:path*",
  ],
};
