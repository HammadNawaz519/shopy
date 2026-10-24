import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/data/categories";
import { PRODUCTS } from "@/lib/data/products";
import ProductCard from "@/components/product/ProductCard";
import { ArrowLeft } from "lucide-react";
import { db, getCachedCategoryBySlug } from "@/lib/db/store";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps) {
  try {
    const found = await getCachedCategoryBySlug(params.category);
    if (found) {
      return { title: found.name };
    }
  } catch {}
  return { title: params.category.toUpperCase() };
}

export const dynamicParams = true;
// Public catalog page: 5-minute ISR. Product data is Redis-cached at db layer.
export const revalidate = 300;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const [categoryRes, dbProductsRes] = await Promise.all([
    getCachedCategoryBySlug(params.category).catch(() => null),
    db.getProducts({ category: params.category }).catch(() => []),
  ]);

  let category: any = null;
  if (categoryRes) {
    category = {
      id: categoryRes.id,
      name: categoryRes.name,
      slug: categoryRes.slug,
      tagline: categoryRes.tagline || `Editorial collection of ${categoryRes.name.toLowerCase()}`,
      image: categoryRes.image,
      description: categoryRes.description || `Curated ${categoryRes.name.toLowerCase()} for the contemporary wardrobe.`,
      aspectRatio: (categoryRes.aspectRatio as any) || "tall",
    };
  }

  if (!category) {
    const staticFound = CATEGORIES.find(
      (c) => c.slug.toLowerCase() === params.category.toLowerCase()
    );
    if (staticFound) {
      category = staticFound;
    }
  }

  if (!category) {
    notFound();
  }

  let categoryProducts: any[] = dbProductsRes || [];
  if (categoryProducts.length === 0) {
    categoryProducts = PRODUCTS.filter(
      (p) => p.category.toLowerCase() === category.slug.toLowerCase()
    );
  }

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      {/* Category Header — editorial style matching the Collections overview */}
      <div className="w-full flex items-center justify-center overflow-hidden mb-10 py-10 sm:py-14 border-b border-[#BBBFCA]/30">
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#495464]/60 hover:text-[#495464] mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Collections</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2">
            EDITORIAL CHAPTERS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#495464]">
            {category.name}
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-3 max-w-md mx-auto">
            {category.tagline || category.description || `Editorial collection of ${String(category.name).toLowerCase()}`}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between pb-4 mb-8 border-b border-[#BBBFCA]/30">
          <span className="text-xs uppercase tracking-widest text-[#495464]/70">
            {categoryProducts.length} {categoryProducts.length === 1 ? "Piece" : "Pieces"} available
          </span>
          <Link
            href="/products"
            className="text-xs uppercase tracking-widest text-[#495464] hover:opacity-70 transition-opacity"
          >
            View Entire Archive →
          </Link>
        </div>

        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {categoryProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 4} aspectClass="aspect-[2/3]" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="font-serif text-2xl text-[#495464] mb-2">Upcoming Collection</h3>
            <p className="text-xs text-[#495464]/60 tracking-wider uppercase">
              New atelier pieces in this category are being prepared for release.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
