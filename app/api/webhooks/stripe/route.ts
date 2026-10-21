import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver (raw body - never JSON-parse first, the signature
 * is computed over the RAW request bytes).
 *
 * Configure in the Stripe Dashboard:
 *   Endpoint: https://buyatshopy.vercel.app/api/webhooks/stripe
 *   Events:   checkout.session.completed (+ optionally checkout.session.expired)
 * Then set the endpoint's signing secret on Vercel as STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!isStripeConfigured() || !webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured on the server yet." },
      { status: 503 }
    );
  }

  const rawBody = await req.text();

  let event: any;
  try {
    const stripe = getStripe();
    // constructWebhookEvent is the current stripe-node name for
    // constructEvent (older SDKs).
    event = stripe.webhooks.constructWebhookEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[STRIPE WEBHOOK] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const orderId =
        typeof session?.metadata?.orderId === "string"
          ? session.metadata.orderId
          : "";
      if (!orderId) {
        console.warn("[STRIPE WEBHOOK] completed session without orderId metadata");
      } else {
        const intentId: string | undefined =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : typeof session.payment_intent?.id === "string"
              ? session.payment_intent.id
              : undefined;
        // Marks the order PAID + CONFIRMED (analytics update from here).
        await db.updateOrderStatusAndPayment(orderId, "PAID", intentId);
      }
    } else if (event.type === "checkout.session.expired") {
      const orderId =
        typeof event.data?.object?.metadata?.orderId === "string"
          ? event.data.object.metadata.orderId
          : "";
      if (orderId) {
        await db.updateOrderStatusAndPayment(orderId, "FAILED");
      }
    }

    // Always ACK fast so Stripe does not retry mid-processing.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK ERROR]", error);
    // 500 tells Stripe to retry delivery later.
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
