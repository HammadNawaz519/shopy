"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/data/categories";

export default function CollectionGrid() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCategories(data.categories || []);
          }
        }
      } catch {} finally {
        if (isMounted) setIsLoaded(true);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredCategories = categories.filter((c) => Boolean(c.featured));
  const displayedCategories = featuredCategories.length > 0 ? featuredCategories : categories;

  if (isLoaded && displayedCategories.length === 0) {
    return null;
  }

  if (displayedCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-24 lg:py-32 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#BBBFCA]/30">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2 font-medium">
              CURATED CHAPTERS
            </span>
            <h2 className="font-serif text-3xl lg:text-5xl font-light tracking-tight text-[#495464]">
              Collections &amp; Categories
            </h2>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[#495464] hover:opacity-70 transition-opacity mt-4 md:mt-0"
          >
            <span>View All Lookbooks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Featured Category Lookbook Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedCategories.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${category.slug}`}
              className="group relative overflow-hidden bg-[#E8E8E8] aspect-[3/4] select-none"
            >
              {/* Category Photography */}
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

              {/* Category Content Overlay */}
              <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-between text-white z-10">
                {/* Top Tagline */}
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-y-2 group-hover:translate-y-0">
                  {category.tagline}
                </span>

                {/* Bottom Title & Explore Arrow */}
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-serif text-2xl lg:text-3xl font-light tracking-wide text-white uppercase mb-2">
                    {category.name}
                  </h3>
                  <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-white/90 group-hover:text-white transition-colors">
                    <span>Explore Category</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
