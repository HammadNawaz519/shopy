"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Predictive Preloading — Instant Navigation.
 *
 * Renders hidden Next.js <Link> elements for the routes a user on the CURRENT
 * page is most likely to open next. Next's router prefetches their RSC payload
 * + JS chunks on idle (no bandwidth on low connection, no layout/UI impact),
 * so the next tap navigates to an already-loaded page — no spinner, no delay.
 *
 * The service worker (sw-enhanced.js) layers stale-while-revalidate caching on
 * top for the native/PWA path, so repeat visits render the cached UI instantly
 * while fresh data loads in the background.
 */

const LIKELY_NEXT: Record<string, string[]> = {
  "/": ["/products", "/collections"],
  "/products": ["/collections", "/cart"],
  "/collections": ["/products", "/collections/tops"],
};

export default function IdlePrefetcher() {
  const pathname = usePathname();
  const routes = LIKELY_NEXT[pathname] ?? [];

  if (routes.length === 0) return null;

  return (
    <span className="sr-only" aria-hidden="true">
      {routes.map((href) => (
        <Link key={href} href={href} prefetch>
          .
        </Link>
      ))}
    </span>
  );
}
