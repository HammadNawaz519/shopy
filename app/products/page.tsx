import React from "react";
import { db, getCachedCategories } from "@/lib/db/store";
import ProductsClientView from "@/components/products/ProductsClientView";

export const metadata = {
  title: "Products",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
