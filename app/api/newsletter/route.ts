import { NextResponse } from "next/server";
import { NewsletterSchema } from "@/lib/security/validation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`newsletter_${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many newsletter subscription attempts." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = NewsletterSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const isNew = db.subscribeNewsletter(email);

    return NextResponse.json({
      success: true,
      message: isNew
        ? "Welcome to SHOPY. You are now subscribed to our private releases."
        : "You are already subscribed to our releases.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process subscription." },
      { status: 500 }
    );
  }
}
