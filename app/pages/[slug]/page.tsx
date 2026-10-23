import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCachedLandingPageBySlug, getCachedCategories } from "@/lib/db/store";

interface PageProps {
  params: {
    slug: string;
  };
}

// Public custom landing page: 5-minute ISR, matches the collection pages.
// Dynamic params are DB-driven — no build-time prerender or prefetch.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps) {
  try {
    const page = await getCachedLandingPageBySlug(params.slug);
    if (page && page.isActive) {
      const meta: Record<string, unknown> = { title: page.name };
      if (page.body.trim()) {
        meta.description = page.body.replace(/\s+/g, " ").trim().slice(0, 160);
      }
      // Relative OG URL — the repo has no metadataBase, so we do not
      // hardcode a production domain here.
      meta.openGraph = { url: `/pages/${params.slug}` };
      return meta;
    }
  } catch {}
  return { robots: { index: false } };
}

export default async function StoreLandingPage({ params }: PageProps) {
  const [page, categories] = await Promise.all([
    getCachedLandingPageBySlug(params.slug).catch(() => null),
    getCachedCategories().catch(() => []),
  ]);

  // Missing OR inactive pages are a genuine 404 (never publicly indexable).
  if (!page || !page.isActive) {
    notFound();
  }

  const assigned = (categories as any[]).filter((c: any) => (c.targetPage ?? null) === page.slug);

  return (
    <div className="pt-20 pb-20 bg-[#F4F4F2] text-[#495464]">
      {/* Page Header */}
      <div className="w-full flex items-center justify-center overflow-hidden py-20 sm:py-28 border-b border-[#1a1c20]/10">
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#495464]/60 hover:text-[#495464] mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-[#1a1c20] uppercase leading-[0.95]">
            {page.name}
          </h1>
          {page.body.trim() && (
            <p className="mt-6 text-xs sm:text-sm text-[#495464]/70 tracking-wide leading-relaxed font-light max-w-2xl mx-auto whitespace-pre-line">
              {page.body}
            </p>
          )}
        </div>
      </div>

      {/* Assigned Collections — 3-col desktop grid, natural (content-driven) height */}
      <div className="max-w-[1720px] mx-auto px-6 lg:px-12">
        {assigned.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 py-12 sm:py-16">
            {assigned.map((category: any) => (
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
        ) : (
          <div className="text-center py-20">
            <h3 className="font-serif text-2xl text-[#495464] mb-2">No collections assigned to this page yet</h3>
            <p className="text-xs text-[#495464]/60 tracking-wider uppercase">
              Collections linked to this page from the admin panel will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
