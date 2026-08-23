import { NextResponse } from "next/server";
import { LoginSchema } from "@/lib/security/validation";
import { verifyPassword } from "@/lib/security/auth";
import { createSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/security/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`login_${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a few minutes before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = LoginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const user = await db.findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create cryptographically signed stateless session
    const session = createSession(user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: session.role,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.id, getSessionCookieOptions());
    return response;
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}
