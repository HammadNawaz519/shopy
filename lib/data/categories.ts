export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: string;
  description: string;
  aspectRatio: "tall" | "wide" | "square";
  featured?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: "cat-1",
    slug: "tops",
    name: "TOPS",
    tagline: "Tailored Shirts, Heavyweight Tees & Knitwear",
    image: "/category-tops.jpg",
    description: "Architectural silhouettes crafted in heavyweight organic cotton, breathable linen, and Italian merino wool.",
    aspectRatio: "tall",
    featured: true,
  },
  {
    id: "cat-2",
    slug: "bottoms",
    name: "BOTTOMS",
    tagline: "Pleated Trousers, Cargo Pants & Denim",
    image: "/category-bottoms.jpg",
    description: "Relaxed drape, high-rise cuts, and precision-tailored pleated trousers designed for fluid motion.",
    aspectRatio: "tall",
    featured: true,
  },
  {
    id: "cat-3",
    slug: "footwear",
    name: "FOOTWEAR",
    tagline: "Minimalist Leather Loafers & Sculptural Boots",
    image: "/category-footwear.jpg",
    description: "Handcrafted calfskin leather footwear bridging timeless craftsmanship with contemporary proportions.",
    aspectRatio: "square",
    featured: true,
  },
  {
    id: "cat-4",
    slug: "fragrances",
    name: "FRAGRANCES",
    tagline: "Artisanal Extrait de Parfum",
    image: "/category-fragrances.jpg",
    description: "Sensory compositions exploring smoky vetiver, amber resin, cedarwood, and delicate desert florals.",
    aspectRatio: "square",
    featured: true,
  },
  {
    id: "cat-5",
    slug: "co-ord-sets",
    name: "CO-ORD SETS",
    tagline: "Monochromatic Tracksuits & Tailored Sets",
    image: "/category-coord-sets.jpg",
    description: "Effortless sartorial sets engineered for seamless everyday transitions with relaxed luxury.",
    aspectRatio: "wide",
    featured: true,
  },
  {
    id: "cat-6",
    slug: "accessories",
    name: "ACCESSORIES",
    tagline: "Leather Goods, Hardware & Eyewear",
    image: "/category-accessories.jpg",
    description: "Tactile leather totes, minimal brass jewelry, and handcrafted titanium sunglasses.",
    aspectRatio: "tall",
    featured: true,
  },
];
