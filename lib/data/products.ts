export interface Product {
  id: string;
  name: string;
  slug: string;
  category: "tops" | "bottoms" | "footwear" | "fragrances" | "accessories" | "co-ord-sets";
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  description: string;
  tag?: "NEW" | "SALE" | "LIMITED" | "ARCHIVE";
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  composition: string[];
  careInstructions: string[];
  details: string[];
  featured?: boolean;
  inStock: boolean;
  stockCount: number;
}

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Architectural Boxy Heavyweight Tee",
    slug: "architectural-boxy-heavyweight-tee",
    category: "tops",
    categoryLabel: "Tops",
    price: 8500,
    originalPrice: 10500,
    description: "Constructed from 280 GSM custom-milled organic French terry cotton. Features dropped shoulders, an oversized silhouette, and a structured mock-rib collar.",
    tag: "NEW",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Raw Ecru", hex: "#F4F4F2" },
      { name: "Obsidian Slate", hex: "#495464" },
      { name: "Muted Bone", hex: "#E8E8E8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    composition: ["100% Organic Heavyweight Cotton", "Pre-shrunk 280 GSM fabric"],
    careInstructions: ["Machine wash cold inside out", "Hang dry in shade", "Iron low heat"],
    details: [
      "Signature drop shoulder fit",
      "Reinforced twin-needle stitching",
      "Fabric washed for ultra-soft hand feel",
      "Made in Lahore atelier",
    ],
    featured: true,
    inStock: true,
    stockCount: 24,
  },
  {
    id: "prod-2",
    name: "Pleated Fluid Wool Trousers",
    slug: "pleated-fluid-wool-trousers",
    category: "bottoms",
    categoryLabel: "Bottoms",
    price: 18500,
    description: "Double front-pleated wide-leg trousers cut in lightweight tropical wool blend. Designed with a clean high-rise waist and concealed horn button fastening.",
    tag: "LIMITED",
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Charcoal Slate", hex: "#495464" },
      { name: "Pebble Grey", hex: "#BBBFCA" },
    ],
    sizes: ["28", "30", "32", "34", "36"],
    composition: ["70% Virgin Tropical Wool", "30% Sustainable Viscose", "Viscose lining"],
    careInstructions: ["Dry clean only", "Steam press at low setting"],
    details: [
      "Deep double front pleats",
      "Adjustable side cinch tabs",
      "Concealed hook and zipper fly",
      "Side slant pockets and back welt pockets",
    ],
    featured: true,
    inStock: true,
    stockCount: 18,
  },
  {
    id: "prod-3",
    name: "Monochrome Minimalist Tracksuit",
    slug: "monochrome-minimalist-tracksuit",
    category: "co-ord-sets",
    categoryLabel: "Co-Ord Sets",
    price: 24500,
    originalPrice: 28000,
    description: "Two-piece relaxed set featuring a minimalist zip jacket with stand collar and coordinating tapered cargo pants in textured double-knit fleece.",
    tag: "SALE",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Ecru Shadow", hex: "#E8E8E8" },
      { name: "Deep Charcoal", hex: "#495464" },
    ],
    sizes: ["S", "M", "L", "XL"],
    composition: ["85% Compact Cotton", "15% Recycled Polyester"],
    careInstructions: ["Machine wash cold with similar colors", "Do not tumble dry"],
    details: [
      "Matte gunmetal two-way zipper",
      "Elasticated waistband with tonal drawcord",
      "Inseam concealed pockets",
      "Embossed micro SHOPY hallmark on hem",
    ],
    featured: true,
    inStock: true,
    stockCount: 12,
  },
  {
    id: "prod-4",
    name: "Sculptural Calfskin Loafers",
    slug: "sculptural-calfskin-loafers",
    category: "footwear",
    categoryLabel: "Footwear",
    price: 32000,
    description: "Modern square-toe slip-on loafers crafted from full-grain Italian calfskin with an exaggerated welt and stacked leather heel.",
    tag: "NEW",
    images: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Onyx Black", hex: "#1A1A1A" },
      { name: "Deep Espresso", hex: "#495464" },
    ],
    sizes: ["40", "41", "42", "43", "44", "45"],
    composition: ["100% Full Grain Calf Leather", "Leather sole with rubber traction insert"],
    careInstructions: ["Condition with neutral leather balm", "Store in cotton dust bag with cedar shoe trees"],
    details: [
      "Handmade Goodyear welt construction",
      "Sculpted square toe profile",
      "Natural veg-tan leather insole",
      "Custom brass hardware accents",
    ],
    featured: true,
    inStock: true,
    stockCount: 9,
  },
  {
    id: "prod-5",
    name: "SHOPY N° 01 — Vetiver & Smoky Amber Extrait",
    slug: "shopy-no-01-vetiver-smoky-amber",
    category: "fragrances",
    categoryLabel: "Fragrances",
    price: 16500,
    description: "An intoxicating 30% concentration extrait de parfum opening with bergamot and pink pepper, settling into smoky Haitian vetiver, leather, and golden amber.",
    tag: "LIMITED",
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Amber Flacon (50ml)", hex: "#BBBFCA" },
    ],
    sizes: ["50ml", "100ml"],
    composition: ["30% Fragrance Oil Concentration", "Alcohol Denat., Parfum, Aqua"],
    careInstructions: ["Store in a cool, dry place away from direct sunlight"],
    details: [
      "Top Notes: Calabrian Bergamot, Pink Peppercorn",
      "Heart Notes: Smoked Cedar, Orris Butter, Cardamom",
      "Base Notes: Haitian Vetiver, Ambergris, Dark Musk",
      "Heavy weighted magnetic flacon cap",
    ],
    featured: true,
    inStock: true,
    stockCount: 30,
  },
  {
    id: "prod-6",
    name: "Architectural Leather Minimalist Tote",
    slug: "architectural-leather-minimalist-tote",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 22000,
    description: "Structured daily tote constructed from semi-rigid vegetable-tanned leather. Fits up to a 16-inch laptop with an internal zipped sleeve.",
    tag: "NEW",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Slate Grey", hex: "#495464" },
      { name: "Natural Sand", hex: "#E8E8E8" },
    ],
    sizes: ["One Size"],
    composition: ["100% Vegetable Tanned Italian Leather", "Raw suede interior"],
    careInstructions: ["Wipe clean with a soft dry cloth", "Avoid prolonged water exposure"],
    details: [
      "Reinforced structural base",
      "Magnetic top bridge closure",
      "Interior zip compartment with key tether",
      "Laser-engraved understated SHOPY logo",
    ],
    featured: true,
    inStock: true,
    stockCount: 15,
  },
  {
    id: "prod-7",
    name: "Oversized Cashmere-Blend Knit Cardigan",
    slug: "oversized-cashmere-blend-knit-cardigan",
    category: "tops",
    categoryLabel: "Tops",
    price: 26000,
    description: "Heavy-gauge waffle knit cardigan spun from Mongolian cashmere and merino wool. Finished with raw horn buttons and relaxed dropped shoulders.",
    tag: "NEW",
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Oatmeal Heather", hex: "#F4F4F2" },
      { name: "Smoke Ash", hex: "#BBBFCA" },
    ],
    sizes: ["S", "M", "L"],
    composition: ["30% Grade-A Cashmere", "70% Extra Fine Merino Wool"],
    careInstructions: ["Hand wash in cold water with wool detergent", "Dry flat"],
    details: [
      "5-gauge heavy English rib stitch",
      "Genuine polished buffalo horn buttons",
      "Deep front welt pockets",
      "Relaxed editorial fit",
    ],
    featured: true,
    inStock: true,
    stockCount: 14,
  },
  {
    id: "prod-8",
    name: "Relaxed Linen Drawstring Pants",
    slug: "relaxed-linen-drawstring-pants",
    category: "bottoms",
    categoryLabel: "Bottoms",
    price: 14500,
    originalPrice: 17000,
    description: "Breathable European flax linen pants featuring a continuous elastic waistband with internal cotton drawstring and straight relaxed legs.",
    tag: "SALE",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&q=80&w=1200",
    ],
    colors: [
      { name: "Bleached Sand", hex: "#E8E8E8" },
      { name: "Dark Slate", hex: "#495464" },
    ],
    sizes: ["S", "M", "L", "XL"],
    composition: ["100% Normandy Flax Linen (Garment Washed)"],
    careInstructions: ["Machine wash gentle cycle cold", "Line dry in shade"],
    details: [
      "Pre-washed for relaxed drape and zero shrinkage",
      "Deep slash front pockets",
      "Internal drawstring with metal aglets",
      "French seam interior finishing",
    ],
    featured: true,
    inStock: true,
    stockCount: 20,
  },
];
