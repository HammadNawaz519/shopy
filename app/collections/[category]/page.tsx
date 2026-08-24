import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/data/categories";
import { PRODUCTS } from "@/lib/data/products";
import ProductCard from "@/components/product/ProductCard";
import { ArrowLeft } from "lucide-react";

import { db } from "@/lib/db/store";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export const revalidate = 60; // 60s ISR edge cache with on-demand admin revalidation

export default async function CategoryPage({ params }: CategoryPageProps) {
  let category: any = null;

  try {
    const dbCats = await db.getCategories();
    const found = dbCats.find(
      (c) => c.slug.toLowerCase() === params.category.toLowerCase()
    );
    if (found) {
      category = {
        id: found.id,
        name: found.name,
        slug: found.slug,
        tagline: found.tagline || `Editorial collection of ${found.name.toLowerCase()}`,
        image: found.image,
        description: found.description || `Curated ${found.name.toLowerCase()} for the contemporary wardrobe.`,
        aspectRatio: (found.aspectRatio as any) || "tall",
      };
    }
  } catch {}

  if (!category) {
    notFound();
  }

  let categoryProducts: any[] = [];
  try {
    const dbProducts = await db.getProducts({ category: category.slug });
    categoryProducts = dbProducts || [];
  } catch {
    categoryProducts = [];
  }

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      {/* Category Hero Banner */}
      <div className="relative w-full h-[50vh] min-h-[380px] bg-[#1a1c20] flex items-center justify-center overflow-hidden mb-16">
        <Image
          src={category.image}
          alt={category.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

        <div className="relative z-10 text-center text-white px-6 max-w-2xl mx-auto">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Collections</span>
          </Link>
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-white uppercase mb-3">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#F4F4F2]/90 tracking-wider uppercase leading-relaxed font-light">
            {category.description}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between pb-6 mb-12 border-b border-[#BBBFCA]/30">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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
