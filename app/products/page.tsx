import React from "react";
import { getCachedProducts, getCachedCategories } from "@/lib/db/store";
import ProductsClientView from "@/components/products/ProductsClientView";

export const metadata = {
  title: "Products",
};

// Public catalog page: 5-minute ISR. No user-specific data rendered.
export const revalidate = 300;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getCachedProducts().catch(() => []),
    getCachedCategories().catch(() => []),
  ]);

  return (
    <ProductsClientView
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
