import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/security/constants";

/**
 * SHOPY Edge Middleware — Vercel Edge Optimized
 *
 * Performance Characteristics:
 * - Zero execution for public pages, static assets, images, and API routes.
 * - Executes strictly for authenticated page access (/account/*) and guest auth flows (/login, /register).
 * - Zero database queries, external network calls, or heavy crypto at the Edge layer.
 * - Microsecond evaluation with single-hop deterministic redirects and open-redirect defense.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. Private Route Protection: /account and nested account pages
  if (pathname.startsWith("/account")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      // Sanitize redirect target to prevent open redirect
      const safeRedirect =
        pathname.startsWith("/") && !pathname.startsWith("//")
          ? `${pathname}${search}`
          : "/account";
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Guest Flow Optimization: Redirect logged-in users away from /login and /register
  if ((pathname === "/login" || pathname === "/register") && sessionToken) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

/**
 * Strict Matcher:
 * Ensures Vercel Edge serves all public pages, assets, and APIs directly without middleware invocation.
 */
export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
