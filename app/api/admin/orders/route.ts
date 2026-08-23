import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";
import { db, OrderStatus, PaymentStatus } from "@/lib/db/store";
import { sendOrderStatusUpdateEmail } from "@/lib/email/mailer";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.toLowerCase().trim();

  let orders = await db.getAllOrders();

  if (status && status !== "ALL") {
    orders = orders.filter((o) => o.status === status);
  }

  if (search) {
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search) ||
        o.shippingAddress.email.toLowerCase().includes(search) ||
        `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`.toLowerCase().includes(search) ||
        o.shippingAddress.phone.includes(search)
    );
  }

  return NextResponse.json({ orders });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { orderId, status, paymentStatus, notes } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const previousOrder = await db.getOrderById(orderId);
    if (!previousOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    let updatedOrder = previousOrder;

    if (status && status !== previousOrder.status) {
      updatedOrder = (await db.updateOrderStatus(orderId, status as any, notes)) || updatedOrder;
      
      // Dispatch status update email to customer (non-blocking)
      try {
        sendOrderStatusUpdateEmail(updatedOrder, status, previousOrder.status, notes).catch((err) =>
          console.error("[STATUS EMAIL ERROR] Failed to send status update:", err)
        );
      } catch {
        // Prevent email issue from failing status update
      }
    }

    if (paymentStatus) {
      updatedOrder = (await db.updateOrderPaymentStatus(orderId, paymentStatus as any)) || updatedOrder;
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch {
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
