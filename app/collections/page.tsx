import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/data/categories";

export default function CollectionsOverviewPage() {
  return (
    <div className="pt-28 pb-32 bg-[#F4F4F2] text-[#495464]">
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        {/* Page Header */}
        <div className="text-center py-12 border-b border-[#BBBFCA]/30 mb-16">
          <span className="text-xs uppercase tracking-widest text-[#495464]/60 block mb-2">
            EDITORIAL CHAPTERS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#495464]">
            Collections
          </h1>
          <p className="text-xs text-[#495464]/70 tracking-wider uppercase mt-3 max-w-md mx-auto">
            Categorical explorations in tactile wools, raw linens, heavy cottons, and artisanal parfums.
          </p>
        </div>

        {/* Collections Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${category.slug}`}
              className="group flex flex-col bg-[#E8E8E8] overflow-hidden"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-[11px] uppercase tracking-widest text-white/80 block mb-1">
                    Lookbook
                  </span>
                  <h3 className="font-serif text-2xl lg:text-3xl font-medium text-white">
                    {category.name}
                  </h3>
                </div>
              </div>
              <div className="p-6 flex items-center justify-between">
                <p className="text-xs text-[#495464]/80 tracking-wider line-clamp-1 pr-4">
                  {category.tagline}
                </p>
                <ArrowRight className="w-4 h-4 text-[#495464] group-hover:translate-x-1.5 transition-transform flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
