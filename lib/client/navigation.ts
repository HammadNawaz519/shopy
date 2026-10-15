"use client";

import { useEffect, useState } from "react";
import type { NavigationItem } from "@/lib/db/store";

export interface NavLink {
  name: string;
  href: string;
}

/**
 * Shared per-page navigation data.
 *
 * The root layout server-renders `NavigationItem[]` into the Navbar and
 * Footer (Redis-cached 30 min, invalidated instantly on admin edits), so a
 * normal app launch makes ZERO /api/navigation requests — the links are in
 * the first HTML frame.
 *
 * This module covers the remaining cases only:
 *   1. The SSR list came back empty (DB/Redis unavailable at render time) —
 *      a one-time client fetch recovers the real navigation.
 *   2. Navbar + Footer both need that fallback — the shared in-flight
 *      promise guarantees at most ONE fetch per page load, and every
 *      consumer converges on the same result.
 *
 * No cache is written here: the server-owned Redis cache remains the only
 * source of truth, and nothing about auth or users is involved.
 */
let sharedItems: NavigationItem[] | null = null;
let inFlight: Promise<NavigationItem[] | null> | null = null;

function normalize(items: unknown): NavigationItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (i): i is NavigationItem =>
      Boolean(i) &&
      typeof (i as any).name === "string" &&
      (i as any).name.trim() !== "" &&
      typeof (i as any).href === "string" &&
      (i as any).href.trim() !== ""
  );
}

function toLinks(items: NavigationItem[]): NavLink[] {
  return items.map((i) => ({ name: i.name.trim(), href: i.href.trim() }));
}

export function fetchNavigationItems(): Promise<NavigationItem[] | null> {
  if (sharedItems && sharedItems.length > 0) {
    return Promise.resolve(sharedItems);
  }
  if (!inFlight) {
    inFlight = fetch("/api/navigation", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const items = normalize(data?.navigation);
        if (items.length > 0) {
          sharedItems = items;
          return items;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * Returns navigation links for a component.
 *
 * Prefers the server-rendered `initialItems`; when the server side had
 * nothing, falls back to the single shared client fetch so Navbar and
 * Footer never duplicate the request.
 */
export function useNavigationLinks(initialItems?: NavigationItem[]): NavLink[] {
  const initial =
    initialItems && initialItems.length > 0 ? initialItems : null;

  const [links, setLinks] = useState<NavLink[]>(() => {
    const source =
      initial ??
      // Only consult in-memory state on the client — on the server the
      // layout always supplies fresh data, so initial is the source of truth.
      (typeof window !== "undefined" && sharedItems && sharedItems.length > 0
        ? sharedItems
        : []);
    return toLinks(source);
  });

  useEffect(() => {
    // Links already present (from SSR or the shared in-memory fallback):
    // nothing to do. Only fetch when we have nothing at all.
    if (links.length > 0) return;
    let active = true;
    fetchNavigationItems().then((items) => {
      if (!active || !items) return;
      setLinks(toLinks(items));
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.length === 0]);

  return links;
}
