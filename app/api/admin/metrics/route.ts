import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const orders = db.getAllOrders();
  const products = db.getProducts();
  const users = db.getAllUsers();

  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED").length;
  const processingOrders = orders.filter((o) => o.status === "PROCESSING").length;
  const shippedOrders = orders.filter((o) => o.status === "SHIPPED").length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;

  const lowStockThreshold = db.getStoreSettings().inventoryAlertThreshold || 5;
  const lowStockProducts = products.filter((p) => p.stockCount > 0 && p.stockCount <= lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.stockCount === 0 || !p.inStock);

  const recentOrders = orders.slice(0, 6);
  const recentCustomers = users.filter((u) => u.role !== "admin").slice(0, 5);

  return NextResponse.json({
    metrics: {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers: users.filter((u) => u.role !== "admin").length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
    },
    pipeline: {
      pending: pendingOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    },
    recentOrders,
    recentCustomers,
    lowStockProducts: lowStockProducts.slice(0, 5),
  });
}
