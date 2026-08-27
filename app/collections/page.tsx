import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { db, getCachedCategories } from "@/lib/db/store";

export const metadata = {
  title: "Collections",
};

export const revalidate = 60; // 60s ISR edge cache with on-demand admin revalidation

export default async function CollectionsOverviewPage() {
  let categories: any[] = [];
  try {
    categories = await getCachedCategories();
  } catch {
    categories = [];
  }

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
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

        {/* Collections Editorial Grid or Empty State */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/collections/${category.slug}`}
                prefetch={false}
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
        ) : (
          <div className="text-center py-24 bg-[#E8E8E8]/40 border border-[#BBBFCA]/40 p-12 max-w-xl mx-auto space-y-4">
            <Sparkles className="w-6 h-6 text-[#495464]/50 mx-auto" />
            <h2 className="font-serif text-2xl text-[#495464]">Lookbooks in Preparation</h2>
            <p className="text-xs text-[#495464]/70 uppercase tracking-widest leading-relaxed">
              New atelier chapters are being curated. Check back soon or explore the full product archive.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[#495464] text-[#F4F4F2] px-6 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-[#363E4B] transition-colors"
              >
                <span>View All Creations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
