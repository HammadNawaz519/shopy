import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // 'low', 'out', 'all'
  const search = searchParams.get("search")?.toLowerCase().trim();

  const [allProducts, settings] = await Promise.all([
    db.getProducts(),
    db.getStoreSettings(),
  ]);

  const lowStockThreshold = settings.inventoryAlertThreshold || 5;

  let filteredProducts = allProducts;

  if (filter === "low") {
    filteredProducts = filteredProducts.filter(
      (p) => p.stockCount > 0 && p.stockCount <= lowStockThreshold
    );
  } else if (filter === "out") {
    filteredProducts = filteredProducts.filter((p) => p.stockCount === 0 || !p.inStock);
  }

  if (search) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.categoryLabel.toLowerCase().includes(search)
    );
  }

  const inventoryItems = filteredProducts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.categoryLabel,
    price: p.price,
    stockCount: p.stockCount,
    inStock: p.inStock,
    isLowStock: p.stockCount > 0 && p.stockCount <= lowStockThreshold,
    isOutOfStock: p.stockCount === 0 || !p.inStock,
    sizes: p.sizes,
    image: Array.isArray(p.images) && p.images[0] ? p.images[0] : "/editorial-craft.jpg",
  }));

  return NextResponse.json({
    inventory: inventoryItems,
    summary: {
      totalSKUs: allProducts.length,
      lowStockCount: allProducts.filter(
        (p) => p.stockCount > 0 && p.stockCount <= lowStockThreshold
      ).length,
      outOfStockCount: allProducts.filter((p) => p.stockCount === 0 || !p.inStock).length,
      totalUnits: allProducts.reduce((sum, p) => sum + p.stockCount, 0),
    },
  });
}

export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, stockCount } = body;

    if (!id || stockCount === undefined) {
      return NextResponse.json({ error: "Product ID and stockCount are required." }, { status: 400 });
    }

    const safeStock = Math.max(0, Number(stockCount));
    const updated = await db.updateProduct(id, { stockCount: safeStock });

    if (!updated) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update inventory." }, { status: 500 });
  }
}
