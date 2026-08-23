import { NextResponse } from "next/server";
import { LoginSchema } from "@/lib/security/validation";
import { verifyPassword } from "@/lib/security/auth";
import { createSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/security/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { db } from "@/lib/db/store";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`login_${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 10 minutes before retrying." },
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

    // Create opaque server session
    const session = createSession(user);
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.id, getSessionCookieOptions());

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}
