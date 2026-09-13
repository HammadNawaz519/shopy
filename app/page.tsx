import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import EditorialSection from "@/components/home/EditorialSection";
import Newsletter from "@/components/home/Newsletter";
import { db, getCachedHomepageConfig, getCachedCategories } from "@/lib/db/store";
import { fetchEditorialMotivationQuote } from "@/lib/groq";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
