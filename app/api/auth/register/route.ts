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
    const rateLimit = await checkRateLimit(`register_${ip}`, { limit: 50, windowMs: 15 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password } = body;

    const normalizedEmail = (email || "").toLowerCase().trim();
    const isAdminAccount = normalizedEmail === ADMIN_EMAIL.toLowerCase();

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

    const passwordHash = await hashPassword(password);
    let user = await db.findUserByEmail(normalizedEmail);

    if (user) {
      // If user already exists (e.g. admin or existing account), update credentials seamlessly
      const updated = await db.updateUser(user.id, {
        name: name || user.name,
        passwordHash,
        role: isAdminAccount ? "admin" : user.role,
      });
      user = updated || user;
    } else {
      // Create new customer account in PostgreSQL
      user = await db.createUser({
        name: name || "SHOPY Client",
        email: normalizedEmail,
        passwordHash,
        role: isAdminAccount ? "admin" : "user",
      });
    }

    // Create session & set cookie
    const session = createSession(user);
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.id, getSessionCookieOptions());

    // Dispatch background confirmation email (non-blocking)
    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      sendVerificationOtp(normalizedEmail, otpCode, user.name).catch(() => {});
    } catch {
      // Ignore background email errors
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
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
