import Hero from "@/components/home/Hero";
import LandingPages from "@/components/home/LandingPages";
import CollectionGrid from "@/components/home/CollectionGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import EditorialSection from "@/components/home/EditorialSection";
import Newsletter from "@/components/home/Newsletter";
import { db, getCachedHomepageConfig, getCachedCategories, getCachedLandingPages } from "@/lib/db/store";
import { fetchEditorialMotivationQuote } from "@/lib/groq";

// Public catalog page: 5-minute ISR. Redis already caches the underlying data
// at the db layer (10-30 min), so this adds the Next.js RSC payload cache on top.
// No user-specific or sensitive data is rendered here.
export const revalidate = 300;

export default async function HomePage() {
  const [config, categories, featuredProducts, editorialQuote, landingPages] = await Promise.all([
    getCachedHomepageConfig().catch(() => null),
    getCachedCategories().catch(() => []),
    db.getProducts({ featured: true }).catch(() => []),
    fetchEditorialMotivationQuote().catch(() => undefined),
    getCachedLandingPages(true).catch(() => []),
  ]);

  const activePageSlugs = (landingPages as any[]).map((p) => p.slug);

  return (
    <>
      <Hero initialConfig={config || undefined} />
      {/* Store Pages: admin-created custom landing sections, directly below the hero */}
      <LandingPages pages={landingPages} categories={categories} activePageSlugs={activePageSlugs} />
      <CollectionGrid
        initialCategories={categories}
        collectionsTitle={(config as any)?.collectionsTitle}
        activePageSlugs={activePageSlugs}
      />
      <FeaturedProducts initialProducts={featuredProducts} initialConfig={config || undefined} />
      <EditorialSection
        initialQuote={editorialQuote}
        initialConfig={config || undefined}
      />
      <Newsletter />
    </>
  );
}
