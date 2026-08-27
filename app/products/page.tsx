import React from "react";
import { db, getCachedCategories } from "@/lib/db/store";
import ProductsClientView from "@/components/products/ProductsClientView";

export const metadata = {
  title: "Products",
};

export const revalidate = 60; // 60s ISR edge cache with on-demand admin revalidation

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    db.getProducts().catch(() => []),
    getCachedCategories().catch(() => []),
  ]);

  return (
    <ProductsClientView
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
