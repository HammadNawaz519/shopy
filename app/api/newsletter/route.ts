import { NextResponse } from "next/server";
import { NewsletterSchema } from "@/lib/security/validation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";
import { corsPreflightResponse, withPublicCors } from "@/lib/cors";

// Public route: CORS-enabled so the APK instant-launch shell's newsletter
// form can subscribe through the live app (rate limiting still applies per
// client IP; no credentials involved).
export async function OPTIONS() {
  return corsPreflightResponse("POST, GET");
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`newsletter_${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.success) {
      return withPublicCors(
        NextResponse.json(
          { error: "Too many newsletter subscription attempts." },
          { status: 429 }
        ),
        "POST, GET"
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = NewsletterSchema.safeParse(body);

    if (!parseResult.success) {
      return withPublicCors(
        NextResponse.json(
          { error: parseResult.error.errors[0].message },
          { status: 400 }
        ),
        "POST, GET"
      );
    }

    const { email } = parseResult.data;
    const isNew = await db.subscribeNewsletter(email);

    return withPublicCors(
      NextResponse.json({
        success: true,
        message: isNew
          ? "Welcome to SHOPY. You are now subscribed to our private releases."
          : "You are already subscribed to our releases.",
      }),
      "POST, GET"
    );
  } catch {
    return withPublicCors(
      NextResponse.json(
        { error: "Unable to process subscription." },
        { status: 500 }
      ),
      "POST, GET"
    );
  }
}
