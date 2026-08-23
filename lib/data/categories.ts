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
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200",
    description: "Architectural silhouettes crafted in heavyweight organic cotton, breathable linen, and Italian merino wool.",
    aspectRatio: "tall",
    featured: true,
  },
  {
    id: "cat-2",
    slug: "bottoms",
    name: "BOTTOMS",
    tagline: "Pleated Trousers, Cargo Pants & Denim",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=1200",
    description: "Relaxed drape, high-rise cuts, and precision-tailored pleated trousers designed for fluid motion.",
    aspectRatio: "tall",
    featured: true,
  },
  {
    id: "cat-3",
    slug: "footwear",
    name: "FOOTWEAR",
    tagline: "Minimalist Leather Loafers & Sculptural Boots",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
    description: "Handcrafted calfskin leather footwear bridging timeless craftsmanship with contemporary proportions.",
    aspectRatio: "square",
    featured: true,
  },
  {
    id: "cat-4",
    slug: "fragrances",
    name: "FRAGRANCES",
    tagline: "Artisanal Extrait de Parfum",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200",
    description: "Sensory compositions exploring smoky vetiver, amber resin, cedarwood, and delicate desert florals.",
    aspectRatio: "square",
    featured: true,
  },
  {
    id: "cat-5",
    slug: "accessories",
    name: "ACCESSORIES",
    tagline: "Leather Goods, Hardware & Eyewear",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200",
    description: "Tactile leather totes, minimal brass jewelry, and handcrafted titanium sunglasses.",
    aspectRatio: "tall",
    featured: true,
  },
  {
    id: "cat-6",
    slug: "co-ord-sets",
    name: "CO-ORD SETS",
    tagline: "Monochromatic Tracksuits & Tailored Sets",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200",
    description: "Effortless sartorial sets engineered for seamless everyday transitions with relaxed luxury.",
    aspectRatio: "wide",
    featured: true,
  },
];
