import { NextResponse } from "next/server";
import { ContactSchema } from "@/lib/security/validation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`contact_${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many messages sent. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = ContactSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    await db.addInquiry(parseResult.data);

    return NextResponse.json({
      success: true,
      message: "Your message has been delivered to our concierge team.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
