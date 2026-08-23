import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/security/session";

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
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

    return NextResponse.json(
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
