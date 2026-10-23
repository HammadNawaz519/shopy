import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingPage } from "@/lib/db/store";
import { collectionCardHref } from "@/lib/storefront-links";

interface LandingPagesProps {
  /** Active pages, pre-sorted by orderIndex (fetched via getCachedLandingPages(true)). */
  pages: LandingPage[];
  /** All categories with their targetPage field (DB list; static fallbacks lack it). */
  categories: any[];
  /** Slugs of the active pages — the shared link rule falls back to the
   * standard collection URL for any target not in this set (hidden/deleted). */
  activePageSlugs: string[];
}

/**
 * Store Pages — renders each admin-created custom page as a homepage section
 * directly below the hero: a big bold serif heading (admin-typed name),
 * optional free-text body, and a 3-column grid of the collections assigned to
 * that page. Content-driven height: one assigned collection renders a single
 * card row with natural padding (never a forced viewport height).
 */
export default function LandingPages({ pages, categories, activePageSlugs }: LandingPagesProps) {
  if (!pages || pages.length === 0) return null;

  const assignedFor = (slug: string) =>
    (categories || []).filter((c: any) => (c.targetPage ?? null) === slug);

  return (
    <>
      {pages.map((page) => {
        const assigned = assignedFor(page.slug);
        return (
          <section
            key={page.id}
            id={page.slug}
            className="bg-[#F4F4F2] text-[#495464] pt-20 sm:pt-28 pb-10 sm:pb-14"
          >
            <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
              {/* Section heading — same left-aligned style/font as the
                  Collections grid header ("CURATED CHAPTERS / Collections"). */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 pb-6 border-b border-[#BBBFCA]/30">
                <h2 className="font-serif text-3xl lg:text-5xl font-light tracking-tight text-[#495464]">
                  {page.name}
                </h2>
              </div>

              {page.body.trim() && (
                <p className="mt-6 text-xs sm:text-sm text-[#495464]/80 tracking-wider leading-relaxed font-light max-w-2xl whitespace-pre-line">
                  {page.body}
                </p>
              )}

              {/* Assigned collection cards: 1 col mobile / 2 col md / 3 col lg.
                  Cards link per the shared rule (active target ⇒ /pages/x,
                  anything else ⇒ standard /collections/slug). */}
              {assigned.length > 0 && (
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {assigned.map((category: any) => (
                    <Link
                      key={category.id}
                      href={collectionCardHref(category, activePageSlugs)}
                      className="group flex flex-col bg-[#E8E8E8] overflow-hidden"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                          <span className="text-[11px] uppercase tracking-widest text-white/80 block mb-1">
                            Collection
                          </span>
                          <h3 className="font-serif text-2xl lg:text-3xl font-medium text-white">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                      <div className="p-6 flex items-center justify-between bg-[#F4F4F2]">
                        <p className="text-xs text-[#495464]/80 tracking-wider line-clamp-1 pr-4">
                          {category.tagline}
                        </p>
                        <ArrowRight className="w-4 h-4 text-[#495464] group-hover:translate-x-1.5 transition-transform flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
