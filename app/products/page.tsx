import React from "react";
import { db } from "@/lib/db/store";
import ProductsClientView from "@/components/products/ProductsClientView";

export const revalidate = 60; // 60s ISR edge cache with on-demand admin revalidation

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    db.getProducts().catch(() => []),
    db.getCategories().catch(() => []),
  ]);

  return (
    <ProductsClientView
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
