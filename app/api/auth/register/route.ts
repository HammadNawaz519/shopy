import { NextResponse } from "next/server";
import { RegisterSchema } from "@/lib/security/validation";
import { hashPassword } from "@/lib/security/auth";
import { createSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/security/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db, ADMIN_EMAIL } from "@/lib/db/store";
import { sendVerificationOtp } from "@/lib/email/mailer";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`register_${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password, otpCode, action } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAdminAccount = normalizedEmail === ADMIN_EMAIL.toLowerCase();

    // =========================================================================
    // STEP 2: VERIFY OTP CODE & ESTABLISH SESSION
    // =========================================================================
    if (action === "verify" || otpCode) {
      if (!otpCode || otpCode.trim().length < 6) {
        return NextResponse.json(
          { error: "Please enter a valid 6-digit verification code." },
          { status: 400 }
        );
      }

      const user = await db.findUserByEmail(normalizedEmail);
      if (!user) {
        return NextResponse.json(
          { error: "Verification request not found. Please request a new code." },
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

      // If password provided in verify step, update it
      let passwordHash = user.passwordHash;
      if (password && password.length >= 8) {
        passwordHash = await hashPassword(password);
      }

      // Clear token and persist updated user
      const updatedUser = await db.updateUser(user.id, {
        name: name || user.name,
        passwordHash,
        role: isAdminAccount ? "admin" : user.role,
        resetToken: undefined,
        resetTokenExpiry: undefined,
      });

      const finalUser = updatedUser || user;

      // Create session & set cookie
      const session = createSession(finalUser);
      const cookieStore = cookies();
      cookieStore.set(SESSION_COOKIE_NAME, session.id, getSessionCookieOptions());

      return NextResponse.json(
        {
          success: true,
          user: {
            id: finalUser.id,
            name: finalUser.name,
            email: finalUser.email,
            role: finalUser.role,
          },
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // STEP 1: INITIAL REGISTRATION REQUEST -> SEND REAL OTP VIA SMTP
    // =========================================================================
    const parseResult = RegisterSchema.safeParse({ name, email: normalizedEmail, password });
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const otpGenerated = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    let existing = await db.findUserByEmail(normalizedEmail);

    if (existing) {
      // User already exists in DB (e.g. pre-seeded admin or existing user)
      // Save OTP to user record and send code
      await db.updateUser(existing.id, {
        name: name || existing.name,
        passwordHash,
        resetToken: otpGenerated,
        resetTokenExpiry: expiry,
      });
    } else {
      // Create new user in pending state with OTP
      existing = await db.createUser({
        name: name || "SHOPY Client",
        email: normalizedEmail,
        passwordHash,
        role: isAdminAccount ? "admin" : "user",
      });

      await db.updateUser(existing.id, {
        resetToken: otpGenerated,
        resetTokenExpiry: expiry,
      });
    }

    // Dispatch real email via Gmail SMTP
    try {
      await sendVerificationOtp(normalizedEmail, otpGenerated, name || existing.name);
      console.log(`[REGISTRATION OTP SUCCESS] Code dispatched to ${normalizedEmail}`);
    } catch (mailErr) {
      console.error("[REGISTRATION OTP ERROR] Failed to send email:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        requiresOtp: true,
        message: `A 6-digit verification code has been dispatched to ${normalizedEmail}.`,
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
