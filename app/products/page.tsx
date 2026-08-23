"use client";

import React, { useState, useMemo } from "react";
import { PRODUCTS } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/data/categories";
import ProductCard from "@/components/product/ProductCard";
import { Filter, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("featured");
  const [priceRange, setPriceRange] = useState<number>(40000);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    list = list.filter((p) => p.price <= priceRange);

    switch (selectedSort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return list;
  }, [selectedCategory, selectedSort, priceRange]);

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        {/* Page Title & Breadcrumb */}
        <div className="text-center py-12 border-b border-[#BBBFCA]/30 mb-12">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2">
            CATALOGUE ARCHIVE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#495464]">
            All Creations
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-3">
            Showing {filteredProducts.length} curated pieces
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-8 border-b border-[#BBBFCA]/20">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 text-xs uppercase tracking-widest transition-all ${
                selectedCategory === "all"
                  ? "bg-[#495464] text-[#F4F4F2]"
                  : "bg-[#E8E8E8] text-[#495464] hover:bg-[#BBBFCA]/40"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 text-xs uppercase tracking-widest transition-all ${
                  selectedCategory === cat.slug
                    ? "bg-[#495464] text-[#F4F4F2]"
                    : "bg-[#E8E8E8] text-[#495464] hover:bg-[#BBBFCA]/40"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#495464]">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-[#E8E8E8] border border-[#BBBFCA]/50 text-xs px-3 py-1.5 focus:outline-none focus:border-[#495464]"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <h3 className="font-serif text-2xl text-[#495464]/80 mb-2">No pieces found</h3>
            <p className="text-xs text-[#495464]/60 tracking-wider">
              Try adjusting your category filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
