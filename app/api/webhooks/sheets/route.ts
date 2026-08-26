import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getGoogleSheetsConfig } from "@/lib/sheets/config";
import { processInboundSheetPaymentUpdate } from "@/lib/sheets/service";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const SheetsWebhookSchema = z.object({
  orderReference: z.string().min(1, "Order reference is required"),
  paymentStatus: z.string().optional(),
  orderStatus: z.string().optional(),
  notes: z.string().max(500).optional(),
  adminName: z.string().max(100).optional(),
  adminEmail: z.string().email().optional().or(z.string().max(100).optional()),
  idempotencyKey: z.string().max(150).optional(),
});

/**
 * Timing-safe string comparison to protect against side-channel timing attacks.
 */
function isSecretValid(providedSecret: string | null | undefined, expectedSecret: string): boolean {
  if (!providedSecret || typeof providedSecret !== "string") return false;
  if (!expectedSecret || typeof expectedSecret !== "string") return false;

  try {
    const a = Buffer.from(providedSecret.trim());
    const b = Buffer.from(expectedSecret.trim());
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Validates request authentication headers against configured server secret.
 */
function authenticateWebhookRequest(req: Request): boolean {
  const config = getGoogleSheetsConfig();
  const expectedSecret = config.webhookSecret;

  if (!expectedSecret) return false;

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const customHeader = req.headers.get("x-sheets-secret") || req.headers.get("X-Sheets-Secret");
  const apiKeyHeader = req.headers.get("x-api-key") || req.headers.get("X-Api-Key");

  let providedSecret: string | undefined = undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedSecret = authHeader.substring(7).trim();
  } else if (customHeader) {
    providedSecret = customHeader.trim();
  } else if (apiKeyHeader) {
    providedSecret = apiKeyHeader.trim();
  }

  return isSecretValid(providedSecret, expectedSecret);
}

/**
 * GET /api/webhooks/sheets
 * Diagnostic and health-check endpoint for Google Apps Script handshake.
 */
export async function GET(req: Request) {
  const isAuth = authenticateWebhookRequest(req);
  if (!isAuth) {
    return NextResponse.json(
      { error: "Unauthorized: Valid webhook authentication token required." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "active",
    integration: "SHOPY Google Sheets Inbound Synchronization",
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/webhooks/sheets
 * Authoritative inbound payment status synchronization endpoint.
 *
 * Receives cell edit events from Google Sheets (via Google Apps Script onEdit trigger)
 * and safely transitions the order in Supabase PostgreSQL while enforcing all
 * business rules, idempotency, email dispatch, and sheet reconciliation.
 */
export async function POST(req: Request) {
  // 1. Authenticate Request
  const isAuth = authenticateWebhookRequest(req);
  if (!isAuth) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing Google Sheets webhook secret.",
      },
      { status: 401 }
    );
  }

  // 2. Apply Rate Limiting (Up to 120 webhook calls per minute per IP)
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimit(`sheets-webhook:${clientIp}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });

  if (!rateCheck.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Please wait a few seconds before retrying.",
      },
      { status: 429 }
    );
  }

  // 3. Parse and Validate Request Payload
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = SheetsWebhookSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || "Invalid payload format.",
        },
        { status: 400 }
      );
    }

    const { orderReference, paymentStatus, orderStatus, notes, adminName, adminEmail, idempotencyKey } =
      parseResult.data;

    // 4. Process Inbound Payment Status Update in Supabase PostgreSQL
    const syncResult = await processInboundSheetPaymentUpdate({
      orderReference,
      paymentStatus,
      orderStatus,
      notes,
      adminName,
      adminEmail,
      idempotencyKey,
    });

    return NextResponse.json(
      {
        success: syncResult.success,
        updated: syncResult.updated,
        orderNumber: syncResult.orderNumber,
        previousPaymentStatus: syncResult.previousPaymentStatus,
        newPaymentStatus: syncResult.newPaymentStatus,
        currentPaymentStatus: syncResult.currentPaymentStatus,
        currentOrderStatus: syncResult.currentOrderStatus,
        message: syncResult.message,
        error: syncResult.error,
      },
      { status: syncResult.status }
    );
  } catch (error: any) {
    console.error("[SHEETS WEBHOOK ROUTE ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error processing Google Sheets webhook.",
      },
      { status: 500 }
    );
  }
}
