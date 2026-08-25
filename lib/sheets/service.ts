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
    new Date(order.createdAt).toLocaleString("en-PK"),
    new Date(order.updatedAt || order.createdAt).toLocaleString("en-PK"),
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
      new Date().toLocaleString("en-PK"),
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
      new Date().toLocaleString("en-PK"),
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
