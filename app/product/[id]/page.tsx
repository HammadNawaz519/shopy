import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { PRODUCTS } from "@/lib/data/products";
import ProductDetailClientView from "@/components/product/ProductDetailClientView";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  try {
    const dbProducts = await db.getProducts();
    const product = dbProducts.find((p) => p.id === params.id || p.slug === params.id);
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

export const revalidate = 60; // 60s ISR edge cache with on-demand admin revalidation

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let product: any = null;

  try {
    const dbProducts = await db.getProducts();
    product = dbProducts.find((p) => p.id === params.id || p.slug === params.id);
  } catch {}

  if (!product) {
    product = PRODUCTS.find((p) => p.id === params.id || p.slug === params.id);
  }

  if (!product) {
    notFound();
  }

  let relatedProducts: any[] = [];
  try {
    const dbRelated = await db.getProducts({ category: product.category });
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
    />
  );
}
