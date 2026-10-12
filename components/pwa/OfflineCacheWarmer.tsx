"use client";

import { useEffect } from "react";
import { CATEGORIES } from "@/lib/data/categories";
import { PRODUCTS } from "@/lib/data/products";

/**
 * Offline Cache Warmer — makes the whole catalog work offline.
 *
 * While the device is ONLINE (at idle), this asks the service worker to cache
 * every storefront route in two shapes:
 *
 *   PAGES  : the HTML document  → covers cold open, deep links and full
 *                                reloads while offline.
 *   FLIGHT : the RSC payload   → covers client-side router navigation while
 *                                offline (this is what "tapping a product"
 *                                actually needs; without it the tap bounces
 *                                back to the cached home shell).
 *
 * The catalog is bounded (home, products, collections, each category, each
 * product + static info pages), so the warm pass is cheap. It runs once per
 * browser session per service-worker version; later visits stay covered by
 * the natural stale-while-revalidate caching of every request the user makes.
 *
 * It never fabricates data: warming only stores fresh server responses, and
 * when offline the user gets the last-known snapshot — the same guarantee the
 * rest of the service worker upholds for admin/checkout (always network).
 */

const WARM_FLAG = "shopy-offline-warmed-v2";

// Always-warmed storefront routes (stable, few, cheap).
// Session-gated page shells (/cart, /checkout, /account) are warmed too so
// offline navigation renders their real last-known view instead of bouncing to
// the home shell. Only their HTML document + RSC payload are cached; their
// data APIs and order/payment mutations always stay network-only.
const ALWAYS_PATHS = [
  "/",
  "/products",
  "/collections",
  "/search",
  "/cart",
  "/checkout",
  "/account",
  "/shipping",
  "/returns",
  "/size-guide",
  "/faq",
  "/about",
  "/contact",
];

async function buildCatalogPaths(): Promise<string[]> {
  const paths = new Set<string>(ALWAYS_PATHS);

  // Live catalog first (DB products may exist that the static list lacks).
  try {
    const [catRes, prodRes] = await Promise.all([
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch("/api/products", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ]);

    const categories: any[] = catRes?.categories ?? [];
    const products: any[] = prodRes?.products ?? [];

    for (const c of categories) {
      if (c?.slug) paths.add(`/collections/${c.slug}`);
    }
    for (const p of products) {
      if (p?.id) paths.add(`/product/${p.id}`);
    }

    if (categories.length > 0 || products.length > 0) {
      return Array.from(paths);
    }
  } catch {
    /* fall through to the static catalog below */
  }

  // Static fallback: bundled catalog constants.
  for (const c of CATEGORIES) {
    if (c?.slug) paths.add(`/collections/${c.slug}`);
  }
  for (const p of PRODUCTS) {
    if (p?.id) paths.add(`/product/${p.id}`);
  }
  return Array.from(paths);
}

export default function OfflineCacheWarmer() {
  useEffect(() => {
    let cancelled = false;

    const warm = async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
      if (!navigator.onLine) return; // warming must happen online, by design

      try {
        if (sessionStorage.getItem(WARM_FLAG)) return; // once per session
      } catch {
        /* storage unavailable — safe to proceed */
      }

      // First load may not be controlled yet; wait briefly for the SW.
      let controller = navigator.serviceWorker.controller;
      if (!controller) {
        await new Promise<void>((resolve) => {
          const onController = () => resolve();
          navigator.serviceWorker.addEventListener("controllerchange", onController, { once: true });
          setTimeout(resolve, 4000);
        });
        controller = navigator.serviceWorker.controller;
      }
      if (!controller || cancelled) return;

      const paths = await buildCatalogPaths();
      if (cancelled || paths.length === 0) return;

      try {
        sessionStorage.setItem(WARM_FLAG, String(paths.length));
      } catch {
        /* best effort */
      }

      controller.postMessage({ type: "WARM_OFFLINE", paths });
    };

    // Run at idle: no layout impact, no wasted bandwidth on slow connections.
    let idleId: number | undefined;
    let timerId: number | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(warm, { timeout: 15000 });
    } else {
      timerId = setTimeout(warm, 8000) as unknown as number;
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);

  return null;
}
