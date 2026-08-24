import { NextResponse } from "next/server";
import { ContactSchema } from "@/lib/security/validation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";
import { sendContactFormEmails } from "@/lib/email/mailer";

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

    const { name, email, subject, message } = parseResult.data;

    // 1. Save inquiry in database
    let inquiryId: number | undefined;
    try {
      const savedInquiry = await db.addInquiry({ name, email, subject, message });
      inquiryId = savedInquiry?.id;
    } catch (dbErr) {
      console.error("[CONTACT DB ERROR] Failed to save inquiry:", dbErr);
    }

    // 2. Dispatch email via Support SMTP sender (shopy.support@gmail.com)
    // Non-blocking safe dispatch with Reply-To customer email
    try {
      sendContactFormEmails({
        name,
        email,
        subject,
        message,
        inquiryId,
      }).catch((emailErr) => {
        console.error("[CONTACT EMAIL ERROR] Failed to dispatch support emails:", emailErr);
      });
    } catch {
      // Prevent email transport issues from failing user request
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been delivered to our concierge team.",
    });
  } catch (error: any) {
    console.error("[CONTACT HANDLER ERROR]", error);
    return NextResponse.json(
      { error: "Unable to send the message right now. Please try again." },
      { status: 500 }
    );
  }
}
