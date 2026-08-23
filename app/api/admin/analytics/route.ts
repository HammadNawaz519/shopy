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

  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  const completedOrdersCount = orders.filter((o) => o.status !== "CANCELLED").length;
  const aov = completedOrdersCount > 0 ? Math.round(totalRevenue / completedOrdersCount) : 0;

  // Product sales map
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; image: string }> = {};
  const categorySalesMap: Record<string, number> = {};

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    for (const item of order.items) {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
          image: item.image,
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += item.price * item.quantity;

      const prod = products.find((p) => p.id === item.productId);
      const cat = prod?.categoryLabel || "Other";
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + item.price * item.quantity;
    }
  }

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categoryBreakdown = Object.entries(categorySalesMap).map(([category, revenue]) => ({
    category,
    revenue,
    percent: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
  }));

  // Status breakdown
  const statusDistribution = {
    CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
    PROCESSING: orders.filter((o) => o.status === "PROCESSING").length,
    SHIPPED: orders.filter((o) => o.status === "SHIPPED").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return NextResponse.json({
    analytics: {
      totalRevenue,
      totalOrders: orders.length,
      aov,
      topProducts,
      categoryBreakdown,
      statusDistribution,
    },
  });
}
