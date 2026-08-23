import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase().trim();

  const users = await db.getAllUsers();
  const allOrders = await db.getAllOrders();

  let customers = users.map((u) => {
    const userOrders = allOrders.filter((o) => o.userId === u.id || o.shippingAddress.email.toLowerCase() === u.email.toLowerCase());
    const totalSpent = userOrders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.total, 0);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      orderCount: userOrders.length,
      totalSpent,
      lastOrderDate: userOrders[0]?.createdAt || null,
    };
  });

  if (search) {
    customers = customers.filter(
      (c) => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ customers });
}
