import { NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/security/session";
import { db, OrderStatus, PaymentStatus } from "@/lib/db/store";
import { sendOrderStatusUpdateEmail, sendPaymentReceivedEmail } from "@/lib/email/mailer";
import { syncOrderStatusUpdated } from "@/lib/sheets/service";

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

    const adminName = admin.name || admin.email || "Admin";
    let updatedOrder = previousOrder;
    let orderChanged = false;

    // 1. If status is provided
    const normStatus = status
      ? String(status).toUpperCase().trim() === "VERIFYING"
        ? "VERIFYING_PAYMENT"
        : String(status).toUpperCase().trim()
      : undefined;

    if (normStatus && (normStatus !== previousOrder.status || normStatus === "VERIFYING_PAYMENT")) {
      updatedOrder =
        (await db.updateOrderStatus(orderId, normStatus as OrderStatus, notes, adminName)) ||
        updatedOrder;
      orderChanged = true;

      // Check if payment was automatically verified/marked paid by this status transition
      if (updatedOrder.paymentStatus === "PAID" && previousOrder.paymentStatus !== "PAID") {
        try {
          await sendPaymentReceivedEmail(updatedOrder);
        } catch {}
      }

      // Customer status update email (only if status actually changed)
      const customerNotifiableStatuses = [
        "CONFIRMED",
        "PREPARING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED",
        "VERIFYING_PAYMENT",
      ];

      if (customerNotifiableStatuses.includes(String(status).toUpperCase())) {
        try {
          await sendOrderStatusUpdateEmail(updatedOrder, status, previousOrder.status, notes);
        } catch (statusEmailErr) {
          console.error("[STATUS EMAIL ERROR] Failed to send status update:", statusEmailErr);
        }
      }
    }

    // 2. If payment status is explicitly provided and changed
    if (paymentStatus && paymentStatus !== updatedOrder.paymentStatus) {
      const prevPayment = updatedOrder.paymentStatus;
      updatedOrder =
        (await db.updateOrderPaymentStatus(orderId, paymentStatus as PaymentStatus, notes, adminName)) ||
        updatedOrder;
      orderChanged = true;

      // If payment transitioned to PAID and order status wasn't already updated to PREPARING/DELIVERED
      if (paymentStatus === "PAID" && prevPayment !== "PAID" && !status) {
        try {
          await sendPaymentReceivedEmail(updatedOrder);
        } catch (paymentEmailErr) {
          console.error("[PAYMENT EMAIL ERROR] Failed to send payment received update:", paymentEmailErr);
        }
      } else if (paymentStatus === "REFUNDED" && status !== "CANCELLED" && status !== "REFUNDED") {
        try {
          await sendOrderStatusUpdateEmail(
            updatedOrder,
            "REFUNDED",
            previousOrder.status,
            notes || "Payment has been processed for refund."
          );
        } catch (refundEmailErr) {
          console.error("[REFUND EMAIL ERROR] Failed to send refund update:", refundEmailErr);
        }
      }
    }

    // 3. Synchronize with Google Sheets safely (non-blocking failure isolation)
    if (orderChanged) {
      try {
        await syncOrderStatusUpdated(updatedOrder, status ? `STATUS_${status}` : `PAYMENT_${paymentStatus}`);
      } catch (sheetsErr) {
        console.error("[GOOGLE SHEETS SYNC ERROR]", sheetsErr);
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("[ADMIN UPDATE ORDER ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to update order." }, { status: 500 });
  }
}
