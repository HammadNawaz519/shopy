import { NextResponse } from "next/server";
import { ResetPasswordSchema } from "@/lib/security/validation";
import { hashPassword } from "@/lib/security/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`reset_pw_${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, otpCode, newPassword } = body;

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or verification code." },
        { status: 400 }
      );
    }

    const now = Date.now();
    if (!user.resetToken || user.resetToken !== otpCode.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your inbox and try again." },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < now) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Password reset successful: hash new password and clear token
    const passwordHash = await hashPassword(newPassword);
    await db.updateUser(user.id, {
      passwordHash,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You may now sign in with your new password.",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred during password reset." },
      { status: 500 }
    );
  }
}
