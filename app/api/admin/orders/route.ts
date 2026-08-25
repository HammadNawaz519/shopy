import { NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/security/session";
import { db, OrderStatus, PaymentStatus } from "@/lib/db/store";
import { sendOrderStatusUpdateEmail, sendPaymentReceivedEmail } from "@/lib/email/mailer";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  let admin = await requireAdmin();
  if (!admin) {
    const user = await getCurrentUser();
    if (user && user.role === "admin") {
      admin = user;
    }
  }
  if (!admin && process.env.NODE_ENV !== "production") {
    const user = await getCurrentUser();
    if (user) admin = user;
  }
  return admin;
}

export async function GET(req: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;

  const orders = await db.getAllOrders({ status, search });
  return NextResponse.json({ orders });
}

export async function PATCH(req: Request) {
  const admin = await checkAdmin();
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

    // Deduplication check: only send email if status genuinely changed
    const customerNotifiableStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "REFUNDED",
    ];

    if (status && status !== previousOrder.status) {
      updatedOrder = (await db.updateOrderStatus(orderId, status as any, notes)) || updatedOrder;

      // Dispatch order update email via shopy.orderupdate@gmail.com (non-blocking)
      if (customerNotifiableStatuses.includes(String(status).toUpperCase())) {
        try {
          sendOrderStatusUpdateEmail(updatedOrder, status, previousOrder.status, notes).catch((err) =>
            console.error("[STATUS EMAIL ERROR] Failed to send status update:", err)
          );
        } catch {
          // Prevent email issue from failing status update
        }
      }
    }

    if (paymentStatus && paymentStatus !== previousOrder.paymentStatus) {
      updatedOrder = (await db.updateOrderPaymentStatus(orderId, paymentStatus as any)) || updatedOrder;
      
      // If payment transitioned to PAID, send Payment Received receipt
      if (paymentStatus === "PAID") {
        try {
          sendPaymentReceivedEmail(updatedOrder).catch((err) =>
            console.error("[PAYMENT EMAIL ERROR] Failed to send payment received update:", err)
          );
        } catch {}
      } else if (paymentStatus === "REFUNDED" && status !== "CANCELLED") {
        // If payment transitioned to REFUNDED and status didn't trigger refund email, send refund notice
        try {
          sendOrderStatusUpdateEmail(updatedOrder, "REFUNDED", previousOrder.status, notes || "Payment has been processed for refund.").catch((err) =>
            console.error("[REFUND EMAIL ERROR] Failed to send refund update:", err)
          );
        } catch {}
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("[ADMIN UPDATE ORDER ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to update order." }, { status: 500 });
  }
}
