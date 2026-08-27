import React from "react";
import { notFound } from "next/navigation";
import { db, getCachedProductById, getCachedProductRatingSummary } from "@/lib/db/store";
import { PRODUCTS } from "@/lib/data/products";
import ProductDetailClientView from "@/components/product/ProductDetailClientView";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  try {
    const product = await getCachedProductById(params.id);
    if (product) {
      return { title: product.name };
    }
  } catch {}
  const fallback = PRODUCTS.find((p) => p.id === params.id || p.slug === params.id);
  if (fallback) {
    return { title: fallback.name };
  }
  return { title: "Product" };
}

export const dynamicParams = true;
export const revalidate = 300; // 5-minute ISR Edge CDN cache

export async function generateStaticParams() {
  try {
    const products = await db.getProducts();
    if (products && products.length > 0) {
      return products.map((p) => ({ id: p.id }));
    }
  } catch {}
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let product: any = null;

  try {
    product = await getCachedProductById(params.id);
  } catch {}

  if (!product) {
    product = PRODUCTS.find((p) => p.id === params.id || p.slug === params.id);
  }

  if (!product) {
    notFound();
  }

  let ratingSummary: { averageRating: number; reviewCount: number } = { averageRating: 0, reviewCount: 0 };
  let relatedProducts: any[] = [];

  try {
    const [summary, dbRelated] = await Promise.all([
      getCachedProductRatingSummary(product.id).catch(() => null),
      db.getProducts({ category: product.category }).catch(() => []),
    ]);

    if (summary) {
      ratingSummary = {
        averageRating: summary.averageRating,
        reviewCount: summary.reviewCount,
      };
    }

    relatedProducts = (dbRelated || [])
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
  } catch {
    relatedProducts = PRODUCTS.filter(
      (p) => p.category === product.category && p.id !== product.id
    ).slice(0, 4);
  }

  return (
    <ProductDetailClientView
      product={product}
      relatedProducts={relatedProducts}
      initialRatingSummary={ratingSummary}
    />
  );
}
