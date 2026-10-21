import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await db.getStoreSettings();
    const bankDetails = {
      accountHolderName: settings.bankAccountHolder || "SHOPY Retail Private Limited",
      accountTitle: settings.bankAccountTitle || "SHOPY Main Operations",
      bankName: settings.bankName || "Meezan Bank Limited",
      accountNumber: settings.bankAccountNumber || "01020304050607",
      iban: settings.bankIban || "PK12MEZN0001020304050607",
      raastId: settings.bankRaastId || "03001234567",
      paymentContact: settings.bankPaymentContact || "+92 300 1234567",
      instructions:
        settings.bankPaymentInstructions ||
        "Please transfer the exact total order amount to the bank account above and share screenshot on WhatsApp with your Order ID for instant payment verification.",
    };

    return NextResponse.json(
      {
        // Card (Stripe) is first - only exposed when STRIPE_SECRET_KEY is set
        // on the server, so the checkout page shows it only once active.
        card: {
          enabled: isStripeConfigured(),
          available: isStripeConfigured(),
          title: "Card (Stripe)",
          description: "Secure card payment - the order is confirmed the moment it's charged.",
        },
        cod: {
          enabled: settings.codEnabled ?? true,
          available: settings.codEnabled ?? true,
          title: "Cash on Delivery",
          description: "Pay when your order arrives. Available nationwide across Pakistan.",
        },
        bankTransfer: {
          enabled: settings.bankTransferEnabled ?? true,
          available: settings.bankTransferEnabled ?? true,
          title: "Bank Transfer / Raast",
          description: "Direct bank transfer or Raast instant payment.",
          bankDetails,
        },
        // Backward compatibility
        online: {
          enabled: settings.bankTransferEnabled ?? true,
          available: settings.bankTransferEnabled ?? true,
          title: "Bank Transfer / Raast",
          description: "Direct bank transfer or Raast instant payment.",
          bankDetails,
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
