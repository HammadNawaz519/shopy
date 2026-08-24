"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCTS, Product } from "@/lib/data/products";
import ProductCard from "../product/ProductCard";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [headline, setHeadline] = useState({
    title: "Featured Essentials",
    subtitle: "SELECTION OF THE SEASON",
  });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [prodRes, homeRes] = await Promise.all([
          fetch("/api/products?featured=true"),
          fetch("/api/homepage"),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (isMounted) {
            setProducts(Array.isArray(prodData.products) ? prodData.products.slice(0, 4) : []);
          }
        }

        if (homeRes.ok) {
          const homeData = await homeRes.json();
          if (isMounted && homeData.config) {
            setHeadline({
              title: homeData.config.featuredTitle || "Featured Essentials",
              subtitle: homeData.config.featuredSubtitle || "SELECTION OF THE SEASON",
            });
          }
        }
      } catch {} finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoaded && products.length === 0) {
    return null;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-24 lg:py-32 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#BBBFCA]/30">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2">
              {headline.subtitle}
            </span>
            <h2 className="font-serif text-3xl lg:text-5xl font-medium tracking-tight text-[#495464]">
              {headline.title}
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[#495464] hover:opacity-70 transition-opacity mt-4 md:mt-0"
          >
            <span>View All Pieces</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
