import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import EditorialSection from "@/components/home/EditorialSection";
import Newsletter from "@/components/home/Newsletter";
import { db, getCachedHomepageConfig, getCachedCategories } from "@/lib/db/store";

export const revalidate = 60; // 60s ISR edge cache with on-demand admin revalidation

export default async function HomePage() {
  const [config, categories, featuredProducts] = await Promise.all([
    getCachedHomepageConfig().catch(() => null),
    getCachedCategories().catch(() => []),
    db.getProducts({ featured: true }).catch(() => []),
  ]);

  return (
    <>
      <Hero initialConfig={config || undefined} />
      <CollectionGrid initialCategories={categories} />
      <FeaturedProducts initialProducts={featuredProducts} initialConfig={config || undefined} />
      <EditorialSection />
      <Newsletter />
    </>
  );
}
