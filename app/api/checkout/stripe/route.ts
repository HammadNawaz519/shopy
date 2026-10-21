import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/security/session";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

/**
 * Stripe Checkout (hosted payment page) session creation.
 *
 * Flow: the checkout page first creates the order via POST /api/orders with
 * paymentMethod "card" (the order lands in PENDING), then this route builds
 * a Stripe Checkout Session for that order. When the customer pays, Stripe
 * calls /api/webhooks/stripe, which marks the order PAID + CONFIRMED.
 *
 * Body: { orderId, items: [{productId, name, price, quantity, image?}],
 *         customerEmail? }
 * Response: { url, sessionId }
 */
export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "stripe_not_configured", message: "Card payment is not active yet." },
        { status: 503 }
      );
    }

    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const items: any[] = Array.isArray(body.items) ? body.items : [];
    const customerEmail =
      typeof body.customerEmail === "string" && body.customerEmail.trim()
        ? body.customerEmail.trim()
        : "";

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "No cart items to charge." }, { status: 400 });
    }

    // The order must already exist (created by /api/orders) and belong to
    // this user (or be a guest order they hold the confirmation cookie for).
    const order = await db.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Currency comes from the store settings (PKR in production) so the
    // amount conversion always matches what the customer sees.
    const settings = await db.getStoreSettings();
    const currency = (settings.currency || "PKR").toLowerCase();

    // Sub-units: prices are whole/decimal currency units -> *100.
    const line_items = items.map((item) => {
      const name = String(item.name || item.productId || "SHOPY item");
      const image = String(item.image || "").trim();
      return {
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        price_data: {
          currency,
          unit_amount: Math.round((Number(item.price) || 0) * 100),
          product_data: {
            name,
            // Stripe only accepts absolute https image URLs.
            ...(image.startsWith("http") ? { images: [image] } : {}),
          },
        },
      };
    });

    const origin = (process.env.APP_URL || new URL(req.url).origin).replace(/\/+$/, "");

    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      metadata: { orderId },
      client_reference_id: session.userId || undefined,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      success_url: `${origin}/order-confirmation/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    if (!stripeSession.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: stripeSession.url, sessionId: stripeSession.id });
  } catch (error) {
    console.error("[STRIPE CHECKOUT API ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to start the Stripe payment.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
