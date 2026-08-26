import { getSheetsClient, ensureSpreadsheetStructure, SHEET_NAMES } from "./client";
import { db, type OrderRecord } from "@/lib/db/store";

export interface SyncResult {
  success: boolean;
  attempts: number;
  error?: string;
}

/**
 * Executes a Google Sheets API operation with limited retries and zero-leak failure isolation.
 */
async function executeWithRetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<{ result?: T; attempts: number; error?: string }> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (err: any) {
      lastError = err;
      const cleanMsg = (err?.message || "Unknown error").replace(/([a-zA-Z0-9_\-\.]{30,})/g, "***");
      console.warn(`[GOOGLE SHEETS RETRY] Operation "${operationName}" attempt ${attempt}/${maxAttempts} failed:`, cleanMsg);

      if (attempt < maxAttempts) {
        // Linear backoff: 300ms, 600ms
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
  }

  return {
    attempts: maxAttempts,
    error: lastError?.message || "Operation failed after multiple attempts.",
  };
}

/**
 * Formats a timestamp into accurate Pakistan Standard Time (PKT, UTC+5) for Google Sheets.
 * Format: "DD/MM/YYYY, hh:mm:ss A" (e.g. "26/08/2026, 04:48:16 PM")
 */
export function formatSheetsDateTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "-";
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "-";

    return d.toLocaleString("en-GB", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Formats order data into standard tabular row values for the Orders worksheet.
 */
function formatOrderRow(order: OrderRecord): any[] {
  const customerName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  const productsSummary = order.items
    .map((item) => `${item.name} (${item.quantity})`)
    .join(", ");
  const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const paymentMethod =
    order.paymentMethod === "bank_transfer" || order.paymentMethod === "online"
      ? "BANK"
      : "COD";

  const trackingNumber = (order as any).trackingNumber || (order.paymentDetails as any)?.trackingNumber || "-";
  const address = `${order.shippingAddress.address}${
    order.shippingAddress.province ? `, ${order.shippingAddress.province}` : ""
  }`;

  const rawPhone = (order.shippingAddress.phone || "").trim();
  const phone = rawPhone.startsWith("+") ? `'${rawPhone}` : rawPhone || "-";

  return [
    order.orderNumber,
    customerName,
    order.shippingAddress.email,
    phone,
    productsSummary,
    totalQuantity,
    order.subtotal,
    order.discount || 0,
    order.shipping || 0,
    order.total,
    paymentMethod,
    order.paymentStatus,
    order.status,
    trackingNumber,
    address,
    order.shippingAddress.city,
    formatSheetsDateTime(order.createdAt),
    formatSheetsDateTime(order.updatedAt || order.createdAt),
  ];
}

/**
 * Finds the 1-indexed row number of an existing order in the Orders worksheet by its Order Reference.
 */
async function findOrderRowIndex(orderNumber: string): Promise<number | null> {
  const clientInfo = getSheetsClient();
  if (!clientInfo) return null;

  const { sheets, spreadsheetId } = clientInfo;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_NAMES.ORDERS}'!A:A`,
  });

  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === orderNumber) {
      return i + 1; // 1-indexed row number
    }
  }

  return null;
}

/**
 * Synchronizes an order creation event to Google Sheets.
 * Guaranteed idempotency: updates if order exists, appends if new.
 */
export async function syncOrderCreated(order: OrderRecord): Promise<SyncResult> {
  const isReady = await ensureSpreadsheetStructure();
  if (!isReady) {
    return { success: false, attempts: 1, error: "Google Sheets service unconfigured." };
  }

  const clientInfo = getSheetsClient()!;
  const { sheets, spreadsheetId } = clientInfo;

  const syncOp = await executeWithRetry("syncOrderCreated", async () => {
    // 1. Check if order row already exists
    const existingRow = await findOrderRowIndex(order.orderNumber);
    const orderRowValues = formatOrderRow(order);

    if (existingRow) {
      // Update in-place
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEET_NAMES.ORDERS}'!A${existingRow}:R${existingRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [orderRowValues] },
      });
    } else {
      // Append to Orders worksheet
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${SHEET_NAMES.ORDERS}'!A:R`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [orderRowValues] },
      });
    }

    // 2. Synchronize Order Items worksheet (check if items already exist to avoid duplicate appends)
    const existingItemsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEET_NAMES.ORDER_ITEMS}'!A:A`,
    });
    const existingItemRows = existingItemsRes.data.values || [];
    const hasExistingItems = existingItemRows.some((r) => r[0] === order.orderNumber);

    if (!hasExistingItems && order.items.length > 0) {
      const itemRows = order.items.map((item) => [
        order.orderNumber,
        item.name,
        [item.size, item.color].filter(Boolean).join(" / ") || "Standard",
        item.size || "-",
        item.color || "-",
        item.quantity,
        item.price,
        item.price * item.quantity,
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${SHEET_NAMES.ORDER_ITEMS}'!A:H`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: itemRows },
      });
    }

    return true;
  });

  const success = Boolean(syncOp.result);

  // 3. Log synchronization activity
  await logSyncActivity({
    orderNumber: order.orderNumber,
    event: "ORDER_CREATED",
    integration: "GOOGLE_SHEETS",
    status: success ? "SUCCESS" : "FAILED",
    attempts: syncOp.attempts,
    error: syncOp.error,
  });

  // 4. Update order database record with sync status
  db.logOrderSheetsSync(order.id, {
    status: success ? "SYNCED" : "FAILED",
    syncedAt: new Date().toISOString(),
    error: syncOp.error,
  }).catch(() => {});

  return {
    success,
    attempts: syncOp.attempts,
    error: syncOp.error,
  };
}

/**
 * Synchronizes an order status update event to Google Sheets.
 */
export async function syncOrderStatusUpdated(
  order: OrderRecord,
  eventName: string = "STATUS_UPDATED"
): Promise<SyncResult> {
  const isReady = await ensureSpreadsheetStructure();
  if (!isReady) {
    return { success: false, attempts: 1, error: "Google Sheets service unconfigured." };
  }

  const clientInfo = getSheetsClient()!;
  const { sheets, spreadsheetId } = clientInfo;

  const syncOp = await executeWithRetry("syncOrderStatusUpdated", async () => {
    const existingRow = await findOrderRowIndex(order.orderNumber);

    if (existingRow) {
      // Update the entire row with authoritative state
      const orderRowValues = formatOrderRow(order);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEET_NAMES.ORDERS}'!A${existingRow}:R${existingRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [orderRowValues] },
      });
    } else {
      // Fallback: create complete row if not found
      return syncOrderCreated(order);
    }

    return true;
  });

  const success = Boolean(syncOp.result);

  // Log synchronization activity
  await logSyncActivity({
    orderNumber: order.orderNumber,
    event: eventName,
    integration: "GOOGLE_SHEETS",
    status: success ? "SUCCESS" : "FAILED",
    attempts: syncOp.attempts,
    error: syncOp.error,
  });

  // Update order database record with sync status
  db.logOrderSheetsSync(order.id, {
    status: success ? "SYNCED" : "FAILED",
    syncedAt: new Date().toISOString(),
    error: syncOp.error,
  }).catch(() => {});

  return {
    success,
    attempts: syncOp.attempts,
    error: syncOp.error,
  };
}

/**
 * Synchronizes an email dispatch attempt to the Email Activity worksheet.
 */
export async function syncEmailEvent(entry: {
  orderNumber: string;
  eventType: string;
  recipient: string;
  status: "SENT" | "FAILED";
  error?: string;
}): Promise<void> {
  try {
    const isReady = await ensureSpreadsheetStructure();
    if (!isReady) return;

    const clientInfo = getSheetsClient();
    if (!clientInfo) return;

    const { sheets, spreadsheetId } = clientInfo;
    const row = [
      entry.orderNumber,
      entry.eventType,
      entry.recipient,
      entry.status,
      formatSheetsDateTime(new Date()),
      entry.error || "-",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_NAMES.EMAIL_ACTIVITY}'!A:F`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  } catch (err) {
    console.error("[SHEETS EMAIL ACTIVITY SYNC ERROR]", err);
  }
}

/**
 * Appends a record to the Sync Activity worksheet.
 */
export async function logSyncActivity(entry: {
  orderNumber: string;
  event: string;
  integration: string;
  status: "SUCCESS" | "FAILED";
  attempts: number;
  error?: string;
}): Promise<void> {
  try {
    const clientInfo = getSheetsClient();
    if (!clientInfo) return;

    const { sheets, spreadsheetId } = clientInfo;
    const row = [
      entry.orderNumber,
      entry.event,
      entry.integration,
      entry.status,
      entry.attempts,
      entry.error || "-",
      formatSheetsDateTime(new Date()),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_NAMES.SYNC_ACTIVITY}'!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  } catch (err) {
    console.error("[SHEETS SYNC ACTIVITY LOG ERROR]", err);
  }
}

/**
 * Reconciles a specific field (Payment Status or Order Status) in the Orders worksheet
 * back to the authoritative Supabase PostgreSQL value.
 */
export async function reconcileSheetOrderStatusOrPayment(
  orderNumber: string,
  field: "paymentStatus" | "orderStatus",
  value: string
): Promise<boolean> {
  const clientInfo = getSheetsClient();
  if (!clientInfo) return false;

  const { sheets, spreadsheetId } = clientInfo;
  const rowIndex = await findOrderRowIndex(orderNumber);
  if (!rowIndex) return false;

  // Column L is Payment Status (col 12), Column M is Order Status (col 13), Column R is Last Updated (col 18)
  const colLetter = field === "paymentStatus" ? "L" : "M";
  const nowFormatted = formatSheetsDateTime(new Date());

  try {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: `'${SHEET_NAMES.ORDERS}'!${colLetter}${rowIndex}`,
            values: [[value]],
          },
          {
            range: `'${SHEET_NAMES.ORDERS}'!R${rowIndex}`,
            values: [[nowFormatted]],
          },
        ],
      },
    });
    return true;
  } catch (err) {
    console.error("[SHEETS RECONCILIATION ERROR]", err);
    return false;
  }
}

export interface InboundPaymentSyncParams {
  orderReference: string;
  paymentStatus?: string;
  orderStatus?: string;
  notes?: string;
  adminName?: string;
  adminEmail?: string;
  idempotencyKey?: string;
}

export interface InboundPaymentSyncResult {
  success: boolean;
  status: number;
  updated: boolean;
  orderNumber?: string;
  orderId?: string;
  previousPaymentStatus?: string;
  newPaymentStatus?: string;
  previousOrderStatus?: string;
  newOrderStatus?: string;
  currentPaymentStatus?: string;
  currentOrderStatus?: string;
  message?: string;
  error?: string;
  order?: OrderRecord;
}

/**
 * Authoritative inbound processor for Google Sheets payment status edits.
 *
 * ARCHITECTURAL RULES:
 * 1. Supabase PostgreSQL is the single source of truth.
 * 2. Never trusts Sheet-provided pricing, customer ownership, or totals.
 * 3. Enforces valid payment-state transitions (e.g. prohibits REFUNDED -> PAID, CANCELLED -> PAID).
 * 4. Idempotent: duplicate events do not re-execute database transitions or duplicate emails.
 * 5. Email failure is isolated and does not roll back the database transaction.
 * 6. Reconciles Google Sheet if transition is rejected.
 */
export async function processInboundSheetPaymentUpdate(
  params: InboundPaymentSyncParams
): Promise<InboundPaymentSyncResult> {
  const { orderReference, paymentStatus, orderStatus, notes, adminName, adminEmail } = params;

  if (!orderReference || typeof orderReference !== "string") {
    return {
      success: false,
      status: 400,
      updated: false,
      error: "Order Reference is required.",
    };
  }

  const cleanRef = orderReference.trim();
  const rawPayment = paymentStatus ? String(paymentStatus).toUpperCase().trim() : undefined;
  const rawOrderStatus = orderStatus ? String(orderStatus).toUpperCase().trim() : undefined;

  if (!rawPayment && !rawOrderStatus) {
    return {
      success: false,
      status: 400,
      updated: false,
      error: "Either paymentStatus or orderStatus must be provided.",
    };
  }

  const validPaymentStatuses = [
    "UNPAID",
    "PENDING_VERIFICATION",
    "PAID",
    "FAILED",
    "REFUNDED",
  ];

  if (rawPayment && !validPaymentStatuses.includes(rawPayment)) {
    return {
      success: false,
      status: 400,
      updated: false,
      error: `Invalid payment status "${paymentStatus}". Allowed values: ${validPaymentStatuses.join(", ")}`,
    };
  }

  // Acquire distributed mutex lock to prevent concurrent update races
  let lockRelease: (() => Promise<void>) | null = null;
  try {
    const { acquireDistributedLock } = await import("@/lib/redis");
    const lock = await acquireDistributedLock(`order:sheets-sync:${cleanRef}`, 8);
    if (lock?.release) {
      lockRelease = lock.release;
    }
  } catch {
    // Redis unavailable fallback: PostgreSQL row-level locks handle concurrency safely
  }

  try {
    // 1. Authoritative Lookup from Supabase PostgreSQL (Zero-Trust)
    const existingOrder = await db.getOrderById(cleanRef);
    if (!existingOrder) {
      return {
        success: false,
        status: 404,
        updated: false,
        error: `Order with reference "${cleanRef}" not found in database.`,
      };
    }

    const previousPaymentStatus = existingOrder.paymentStatus;
    const previousOrderStatus = existingOrder.status;
    const adminIdentifier = adminName || adminEmail || "Google Sheets Admin";
    let updatedOrder = existingOrder;
    let paymentChanged = false;
    let statusChanged = false;

    // 2. Validate Payment State Transition Rules
    if (rawPayment && rawPayment !== previousPaymentStatus) {
      const targetPayment = rawPayment as any;

      // RULE 1: Cancelled orders cannot have payment marked PAID from sheets
      if (existingOrder.status === "CANCELLED" && targetPayment === "PAID") {
        await reconcileSheetOrderStatusOrPayment(existingOrder.orderNumber, "paymentStatus", previousPaymentStatus);
        return {
          success: false,
          status: 400,
          updated: false,
          error: `Cannot mark payment as PAID for a CANCELLED order (${cleanRef}). Reverted sheet to ${previousPaymentStatus}.`,
          currentPaymentStatus: previousPaymentStatus,
          currentOrderStatus: previousOrderStatus,
        };
      }

      // RULE 2: REFUNDED payments cannot transition back to PAID or UNPAID
      if (previousPaymentStatus === "REFUNDED" && targetPayment !== "REFUNDED") {
        await reconcileSheetOrderStatusOrPayment(existingOrder.orderNumber, "paymentStatus", previousPaymentStatus);
        return {
          success: false,
          status: 400,
          updated: false,
          error: `Cannot transition payment from REFUNDED to ${targetPayment} for order ${cleanRef}. Reverted sheet to REFUNDED.`,
          currentPaymentStatus: previousPaymentStatus,
          currentOrderStatus: previousOrderStatus,
        };
      }

      // RULE 3: PAID payments cannot be downgraded to PENDING_VERIFICATION or UNPAID from Sheets
      if (previousPaymentStatus === "PAID" && (targetPayment === "PENDING_VERIFICATION" || targetPayment === "UNPAID")) {
        await reconcileSheetOrderStatusOrPayment(existingOrder.orderNumber, "paymentStatus", previousPaymentStatus);
        return {
          success: false,
          status: 400,
          updated: false,
          error: `Cannot revert PAID payment to ${targetPayment} for order ${cleanRef}. Reverted sheet to PAID.`,
          currentPaymentStatus: previousPaymentStatus,
          currentOrderStatus: previousOrderStatus,
        };
      }

      // Execute Authoritative Database Payment Transition
      const updateResult = await db.updateOrderPaymentStatus(
        existingOrder.id,
        targetPayment,
        notes || `Payment status updated to ${targetPayment} via Google Sheets sync`,
        adminIdentifier
      );

      if (!updateResult) {
        return {
          success: false,
          status: 500,
          updated: false,
          error: "Failed to persist payment status update in PostgreSQL database.",
        };
      }

      updatedOrder = updateResult;
      paymentChanged = true;

      // Side Effect: Trigger payment received confirmation email exactly once when transitioning to PAID
      if (targetPayment === "PAID" && previousPaymentStatus !== "PAID") {
        try {
          const { sendPaymentReceivedEmail } = await import("@/lib/email/mailer");
          await sendPaymentReceivedEmail(updatedOrder);
        } catch (emailErr) {
          console.error("[SHEETS SYNC] Payment email error (isolated):", emailErr);
        }
      } else if (targetPayment === "REFUNDED") {
        try {
          const { sendOrderStatusUpdateEmail } = await import("@/lib/email/mailer");
          await sendOrderStatusUpdateEmail(
            updatedOrder,
            "REFUNDED",
            existingOrder.status,
            notes || "Payment has been processed for refund via Google Sheets."
          );
        } catch (refundEmailErr) {
          console.error("[SHEETS SYNC] Refund email error (isolated):", refundEmailErr);
        }
      }
    }

    // 3. Reconcile Spreadsheet & Log Activity
    if (paymentChanged || statusChanged) {
      try {
        await syncOrderStatusUpdated(
          updatedOrder,
          `SHEETS_INBOUND_${paymentChanged ? `PAYMENT_${rawPayment}` : `STATUS_${rawOrderStatus}`}`
        );
      } catch (sheetsErr) {
        console.error("[SHEETS RECONCILIATION ERROR]", sheetsErr);
      }
    }

    return {
      success: true,
      status: 200,
      updated: paymentChanged || statusChanged,
      orderNumber: updatedOrder.orderNumber,
      orderId: updatedOrder.id,
      previousPaymentStatus,
      newPaymentStatus: updatedOrder.paymentStatus,
      previousOrderStatus,
      newOrderStatus: updatedOrder.status,
      currentPaymentStatus: updatedOrder.paymentStatus,
      currentOrderStatus: updatedOrder.status,
      message: paymentChanged || statusChanged
        ? `Successfully synchronized payment status to ${updatedOrder.paymentStatus}`
        : "Order is already in this status (Idempotent no-op).",
      order: updatedOrder,
    };
  } catch (err: any) {
    console.error("[INBOUND SHEETS PAYMENT SYNC ERROR]", err);
    return {
      success: false,
      status: 500,
      updated: false,
      error: err?.message || "Internal server error during Google Sheets synchronization.",
    };
  } finally {
    if (lockRelease) {
      await lockRelease().catch(() => {});
    }
  }
}
