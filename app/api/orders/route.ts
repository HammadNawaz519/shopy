import { NextResponse } from "next/server";
import { CheckoutSchema } from "@/lib/security/validation";
import { db } from "@/lib/db/store";
import { getCurrentUser } from "@/lib/security/session";
import { checkOrderRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { acquireDistributedLock, buildCacheKey, redisGet, redisSet, redisDelPattern, CACHE_TTL, CACHE_VERSION } from "@/lib/redis";
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from "@/lib/email/mailer";
import { syncOrderCreated } from "@/lib/sheets/service";

export async function POST(req: Request) {
  let lockRelease: (() => Promise<void>) | null = null;
  try {
    const ip = getClientIp(req);

    // Optional user association from session
    const session = await getCurrentUser();
    const userId = session ? session.userId : undefined;

    // Distributed Rate Limit
    const rateLimit = await checkOrderRateLimit(userId || ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many order requests. Please wait a few moments." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Request-Level Idempotency Protection
    const rawIdempotencyKey =
      req.headers.get("idempotency-key")?.trim() ||
      req.headers.get("Idempotency-Key")?.trim() ||
      body.idempotencyKey?.trim() ||
      null;

    const idempotencyCacheKey = rawIdempotencyKey
      ? buildCacheKey("idempotency", `order:${userId || ip}:${rawIdempotencyKey}`)
      : null;

    if (idempotencyCacheKey) {
      const existingState = await redisGet<any>(idempotencyCacheKey);
      if (existingState) {
        if (typeof existingState === "object" && existingState.orderId) {
          // Idempotent replay: return previously created order without re-executing
          return NextResponse.json(
            {
              success: true,
              orderId: existingState.orderId,
              orderNumber: existingState.orderNumber,
              total: existingState.total,
              idempotent: true,
            },
            { status: 200 }
          );
        }
        if (existingState === "processing") {
          return NextResponse.json(
            { error: "Your order is currently being placed. Please wait a moment." },
            { status: 409 }
          );
        }
      }

      // Mark request as processing with short TTL
      await redisSet(idempotencyCacheKey, "processing", 300);
    }

    const parseResult = CheckoutSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { items, shippingAddress, paymentMethod, promoCode } = parseResult.data;

    // Concurrency Lock: Prevents simultaneous double-submit clicks
    const lockIdentifier = rawIdempotencyKey
      ? `order:${rawIdempotencyKey}`
      : userId
      ? `order:user:${userId}`
      : `order:email:${shippingAddress.email.toLowerCase()}`;

    const lock = await acquireDistributedLock(lockIdentifier, 8);
    if (!lock.acquired) {
      return NextResponse.json(
        { error: "Your order is currently being placed. Please wait a moment." },
        { status: 409 }
      );
    }
    lockRelease = lock.release;

    // Zero-trust: Recalculate all totals server-side from Supabase PostgreSQL
    const recalculated = await db.recalculateCart(items, promoCode);
    if (recalculated.items.length === 0) {
      return NextResponse.json(
        { error: "No valid products in order." },
        { status: 400 }
      );
    }

    // Authoritative PostgreSQL Transaction (Order + Items + Atomic Inventory Decrement)
    const order = await db.createOrder({
      userId,
      items: recalculated.items,
      subtotal: recalculated.subtotal,
      discount: recalculated.discount,
      shipping: recalculated.shipping,
      total: recalculated.total,
      paymentMethod,
      shippingAddress,
      promoCode: promoCode || undefined,
    });

    // Save completed order state in idempotency cache for duplicate request replays
    if (idempotencyCacheKey) {
      redisSet(
        idempotencyCacheKey,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
        },
        CACHE_TTL.ORDER_IDEMPOTENCY
      ).catch(() => {});
    }

    // Clear synchronized cloud cart for authenticated client
    if (userId) {
      db.clearUserCart(userId).catch(() => {});
    }

    // Re-fetch authoritative order from database with line items and exact state
    const authoritativeOrder = (await db.getOrderById(order.id)) || order;

    // Invalidate product catalog cache because stock changed
    redisDelPattern(`${CACHE_VERSION}:products:*`).catch(() => {});
    redisDelPattern(`${CACHE_VERSION}:product:*`).catch(() => {});

    // Non-blocking async post-commit dispatch (Email, Google Sheets)
    try {
      await Promise.allSettled([
        sendOrderConfirmationEmail(authoritativeOrder),
        sendAdminNewOrderNotification(authoritativeOrder),
        syncOrderCreated(authoritativeOrder),
      ]);
    } catch (dispatchErr) {
      console.error("[ORDER DISPATCH ERROR]", dispatchErr);
    }

    const response = NextResponse.json(
      {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
      },
      { status: 201 }
    );

    // If guest checkout, set a secure temporary cookie for seamless confirmation view
    if (!userId) {
      response.cookies.set(`shopy_guest_order_${order.id}`, "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60, // 24 hours
      });
    }

    return response;
  } catch (err: any) {
    console.error("[ORDER CREATION ERROR]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process order." },
      { status: 500 }
    );
  } finally {
    if (lockRelease) {
      await lockRelease().catch(() => {});
    }
  }
}

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // IDOR Protection: only fetch current user's orders from PostgreSQL
    const orders = await db.getOrdersByUserId(session.userId);
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
