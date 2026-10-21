import Stripe from "stripe";

/**
 * Server-side Stripe client (singleton).
 *
 * Requires the `stripe` npm package (npm install stripe) and the
 * STRIPE_SECRET_KEY environment variable on Vercel. The client is only
 * instantiated when the key is present, so the app runs normally until
 * Stripe is configured.
 */
let stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
