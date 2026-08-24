import { NextResponse } from "next/server";
import { ForgotPasswordSchema } from "@/lib/security/validation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";
import { sendPasswordResetEmail, generateSecureOtp } from "@/lib/email/mailer";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`forgot_pw_${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many verification code requests. Please wait a few minutes before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = ForgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const user = await db.findUserByEmail(email);

    if (user) {
      // Generate 6-digit cryptographically secure verification code
      const otpCode = generateSecureOtp(6);
      const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      await db.updateUser(user.id, {
        resetToken: otpCode,
        resetTokenExpiry,
      });

      // Dispatch password recovery email via dedicated OTP SMTP sender (shopy.otp@gmail.com)
      try {
        await sendPasswordResetEmail(user.email, {
          otpCode,
          name: user.name,
          expiresInMinutes: 10,
        });
      } catch (mailErr) {
        console.error("[SMTP ERROR] Failed to send password reset email:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a 6-digit verification code has been dispatched to your inbox.",
    });
  } catch (error: any) {
    console.error("[FORGOT PASSWORD ERROR]", error);
    return NextResponse.json(
      { error: "Unable to process the request right now. Please try again." },
      { status: 500 }
    );
  }
}
