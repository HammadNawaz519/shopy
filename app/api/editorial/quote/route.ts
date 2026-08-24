import { NextResponse } from "next/server";
import { fetchEditorialMotivationQuote } from "@/lib/groq";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quoteData = await fetchEditorialMotivationQuote();
    return NextResponse.json({ success: true, data: quoteData });
  } catch (error) {
    console.error("Failed to generate quote:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate motivation quote",
      },
      { status: 500 }
    );
  }
}
