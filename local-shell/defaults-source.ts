/**
 * Build-time source for the bundled offline fallback.
 *
 * `scripts/build-cap-shell.mjs` bundles this module and evaluates the
 * exported object to produce the snapshot embedded in the shell when the
 * production APIs are unreachable at build time. It mirrors exactly what
 * the real landing page renders when the database layer is unavailable:
 * the component defaults (Hero, EditorialSection) plus the static catalog
 * seed, so the first visible frame is complete even fully offline on a
 * freshly installed device.
 */
import { PRODUCTS } from "@/lib/data/products";
import type { NavigationItem } from "@/lib/db/store";

export interface ShellSnapshot {
  homepage: any | null;
  categories: any[];
  products: any[];
  navigation: NavigationItem[];
  quote: any;
  source: "live" | "static-fallback";
}

const DEFAULT_CATEGORIES = [
  {
    id: "cat-tops",
    name: "Tops",
    slug: "tops",
    tagline: "ARCHITECTED SILHOUETTES",
    image: "/category-tops.jpg",
    featured: true,
  },
  {
    id: "cat-bottoms",
    name: "Bottoms",
    slug: "bottoms",
    tagline: "PRECISION TAILORED",
    image: "/category-bottoms.jpg",
    featured: true,
  },
  {
    id: "cat-footwear",
    name: "Footwear",
    slug: "footwear",
    tagline: "HEIRLOOM CRAFT",
    image: "/category-footwear.jpg",
    featured: true,
  },
  {
    id: "cat-fragrances",
    name: "Fragrances",
    slug: "fragrances",
    tagline: "OLFACTORY SIGNATURES",
    image: "/category-fragrances.jpg",
    featured: true,
  },
  {
    id: "cat-sets",
    name: "Co-Ord Sets",
    slug: "co-ord-sets",
    tagline: "SEAMLESS ENSEMBLES",
    image: "/category-coord-sets.jpg",
    featured: true,
  },
  {
    id: "cat-accessories",
    name: "Accessories",
    slug: "accessories",
    tagline: "FINISHING DETAILS",
    image: "/category-accessories.jpg",
    featured: true,
  },
];

const DEFAULT_NAVIGATION: NavigationItem[] = [
  { id: "nav-products", name: "Shop", href: "/products", orderIndex: 0, isActive: true },
  { id: "nav-collections", name: "Collections", href: "/collections", orderIndex: 1, isActive: true },
  {
    id: "nav-fragrances",
    name: "Fragrances",
    href: "/collections/fragrances",
    orderIndex: 2,
    isActive: true,
  },
];

export function staticFallbackSnapshot(): ShellSnapshot {
  const featured = PRODUCTS.filter((p) => p.featured).slice(0, 4);
  return {
    homepage: null,
    categories: DEFAULT_CATEGORIES,
    products: featured.length > 0 ? featured : PRODUCTS.slice(0, 4),
    navigation: DEFAULT_NAVIGATION,
    quote: null,
    source: "static-fallback",
  };
}
