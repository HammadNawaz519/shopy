import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import EditorialSection from "@/components/home/EditorialSection";
import Newsletter from "@/components/home/Newsletter";
import { db, getCachedHomepageConfig, getCachedCategories } from "@/lib/db/store";
import { fetchEditorialMotivationQuote } from "@/lib/groq";

// Public catalog page: 5-minute ISR. Redis already caches the underlying data
// at the db layer (10-30 min), so this adds the Next.js RSC payload cache on top.
// No user-specific or sensitive data is rendered here.
export const revalidate = 300;

export default async function HomePage() {
  const [config, categories, featuredProducts, editorialQuote] = await Promise.all([
    getCachedHomepageConfig().catch(() => null),
    getCachedCategories().catch(() => []),
    db.getProducts({ featured: true }).catch(() => []),
    fetchEditorialMotivationQuote().catch(() => undefined),
  ]);

  return (
    <>
      <Hero initialConfig={config || undefined} />
      <CollectionGrid initialCategories={categories} />
      <FeaturedProducts initialProducts={featuredProducts} initialConfig={config || undefined} />
      <EditorialSection initialQuote={editorialQuote} />
      <Newsletter />
    </>
  );
}
