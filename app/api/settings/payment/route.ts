import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await db.getStoreSettings();
    return NextResponse.json(
      {
        cod: {
          available: true,
          title: "Cash on Delivery",
          description: "Pay when your order arrives. Available nationwide across Pakistan.",
        },
        online: {
          available: true,
          title: "Online / Bank Transfer",
          description: "Pay securely via direct bank transfer or internet banking.",
          bankDetails: {
            accountHolderName: settings.bankAccountHolder || "SHOPY Retail Private Limited",
            bankName: settings.bankName || "Meezan Bank Limited",
            accountNumber: settings.bankAccountNumber || "01020304050607",
            iban: settings.bankIban || "PK12MEZN0001020304050607",
            paymentContact: settings.bankPaymentContact || "+92 300 1234567",
            instructions: settings.bankPaymentInstructions || "Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.",
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch payment configuration." },
      { status: 500 }
    );
  }
}
