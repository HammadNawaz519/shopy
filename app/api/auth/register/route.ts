import { NextResponse } from "next/server";
import { RegisterSchema } from "@/lib/security/validation";
import { hashPassword } from "@/lib/security/auth";
import { createSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/security/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db, ADMIN_EMAIL } from "@/lib/db/store";
import { sendWelcomeEmail, sendVerificationOtpEmail, generateSecureOtp } from "@/lib/email/mailer";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`register_${ip}`, { limit: 50, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password, otpCode: incomingOtp, action, resend } = body;
    const normalizedEmail = (email || "").toLowerCase().trim();

    // -------------------------------------------------------------------------
    // ACTION 1: VERIFY OTP & COMPLETE REGISTRATION
    // -------------------------------------------------------------------------
    if (action === "verify" || (incomingOtp && !password)) {
      if (!normalizedEmail || !incomingOtp) {
        return NextResponse.json(
          { error: "Email and verification code are required." },
          { status: 400 }
        );
      }

      const user = await db.findUserByEmail(normalizedEmail);
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or registration session." },
          { status: 400 }
        );
      }

      const now = Date.now();
      if (!user.resetToken || user.resetToken !== incomingOtp.trim()) {
        return NextResponse.json(
          { error: "Invalid verification code. Please check your email and try again." },
          { status: 400 }
        );
      }

      if (!user.resetTokenExpiry || user.resetTokenExpiry < now) {
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new code." },
          { status: 400 }
        );
      }

      // Verification succeeded: clear token (single use) and create session
      await db.updateUser(user.id, {
        resetToken: undefined,
        resetTokenExpiry: undefined,
      });

      const session = createSession(user);

      // Send welcome email in background
      try {
        sendWelcomeEmail(user.email, user.name).catch(() => {});
      } catch {
        // Safe background catch
      }

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

      response.cookies.set(SESSION_COOKIE_NAME, session.id, getSessionCookieOptions());
      return response;
    }

    // -------------------------------------------------------------------------
    // ACTION 2: RESEND OTP CODE
    // -------------------------------------------------------------------------
    if (action === "resend" || resend === true) {
      if (!normalizedEmail) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
      }

      const user = await db.findUserByEmail(normalizedEmail);
      if (!user) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }

      const freshOtp = generateSecureOtp(6);
      const freshExpiry = Date.now() + 10 * 60 * 1000;

      await db.updateUser(user.id, {
        resetToken: freshOtp,
        resetTokenExpiry: freshExpiry,
      });

      try {
        await sendVerificationOtpEmail(user.email, freshOtp, user.name, 10);
      } catch (err) {
        console.error("[SMTP ERROR] Resend OTP failed:", err);
      }

      return NextResponse.json({
        success: true,
        requiresOtp: true,
        message: "A new verification code has been dispatched to your email.",
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 3: INITIAL REGISTRATION SUBMISSION (NAME, EMAIL, PASSWORD)
    // -------------------------------------------------------------------------
    const parseResult = RegisterSchema.safeParse({
      name: name || "Client",
      email: normalizedEmail,
      password,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const isAdminAccount = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    const passwordHash = await hashPassword(password);
    const generatedOtp = generateSecureOtp(6);
    const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    let user = await db.findUserByEmail(normalizedEmail);

    if (user) {
      // If user exists, update password and set OTP
      const updated = await db.updateUser(user.id, {
        name: name || user.name,
        passwordHash,
        role: isAdminAccount ? "admin" : user.role,
        resetToken: generatedOtp,
        resetTokenExpiry,
      });
      user = updated || user;
    } else {
      // Create new customer account in PostgreSQL with pending verification OTP
      user = await db.createUser({
        name: name || "SHOPY Client",
        email: normalizedEmail,
        passwordHash,
        role: isAdminAccount ? "admin" : "user",
      });
      await db.updateUser(user.id, {
        resetToken: generatedOtp,
        resetTokenExpiry,
      });
    }

    // Dispatch real verification OTP email via SMTP
    try {
      await sendVerificationOtpEmail(normalizedEmail, generatedOtp, user.name, 10);
    } catch (mailErr) {
      console.error("[SMTP ERROR] Registration OTP dispatch failed:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        requiresOtp: true,
        email: normalizedEmail,
        message: "A 6-digit verification code has been dispatched to your email.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
