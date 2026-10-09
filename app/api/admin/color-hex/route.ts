import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/session";

export const dynamic = "force-dynamic";

function extractHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/#[0-9a-fA-F]{6}\b/);
  return match ? match[0].toUpperCase() : null;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const colorName = typeof body.colorName === "string" ? body.colorName.trim() : "";
    if (!colorName || colorName.length > 80) {
      return NextResponse.json({ error: "A valid color name is required." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Color suggestion AI is not configured." }, { status: 503 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Return only one six-digit uppercase HEX color code, including the #. Choose the most visually representative web color for the named color.",
          },
          { role: "user", content: colorName },
        ],
        temperature: 0.2,
        max_tokens: 20,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[COLOR HEX AI ERROR] Provider returned", response.status);
      return NextResponse.json({ error: "Color suggestion AI is temporarily unavailable." }, { status: 502 });
    }

    const data = await response.json();
    const hex = extractHex(data.choices?.[0]?.message?.content);
    if (!hex) {
      return NextResponse.json({ error: "AI returned an invalid color value." }, { status: 502 });
    }

    return NextResponse.json({ hex });
  } catch (error) {
    console.error("[COLOR HEX AI ERROR]", error);
    return NextResponse.json({ error: "Failed to generate color suggestion." }, { status: 500 });
  }
}
