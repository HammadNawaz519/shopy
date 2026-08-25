import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/security/session";

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      const res = NextResponse.json(
        { user: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
      res.cookies.set("shopy_client_auth", "", {
        path: "/",
        expires: new Date(0),
      });
      return res;
    }

    const res = NextResponse.json(
      {
        user: {
          id: session.userId,
          name: session.name,
          email: session.email,
          role: session.role,
          createdAt: new Date(session.createdAt).toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
    res.cookies.set("shopy_client_auth", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json(
      { user: null },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}
