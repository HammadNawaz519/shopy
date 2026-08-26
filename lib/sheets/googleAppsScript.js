/**
 * ==============================================================================
 * SHOPY ATELIER — GOOGLE APPS SCRIPT ON-EDIT WEBHOOK SYNCHRONIZER
 * ==============================================================================
 *
 * INSTALLATION INSTRUCTIONS:
 * 1. Open your SHOPY Google Spreadsheet.
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Delete any code in the editor and paste this entire script.
 * 4. Update SHOPY_CONFIG below with:
 *    - API_URL: Your production URL (e.g. "https://your-domain.vercel.app") or ngrok during testing.
 *    - WEBHOOK_SECRET: Matches GOOGLE_SHEETS_WEBHOOK_SECRET or SESSION_SECRET from your .env.local.
 * 5. Click Save (Disk icon).
 * 6. Set up an Installable onEdit trigger:
 *    - In the left sidebar of Apps Script, click Triggers (Clock icon).
 *    - Click "+ Add Trigger" (bottom right).
 *    - Choose which function to run: `installedOnEdit`
 *    - Select event source: `From spreadsheet`
 *    - Select event type: `On edit`
 *    - Click Save and grant required permissions.
 *
 * HOW IT WORKS:
 * - Listens for cell edits on the "Orders" sheet.
 * - When Column L (Payment Status, col 12) or Column M (Order Status, col 13) is edited by an admin:
 *   1. Identifies the Order Reference in Column A of the same row.
 *   2. Sends a secure, authenticated POST request to /api/webhooks/sheets.
 *   3. If the update is approved by Supabase, the sheet stays updated.
 *   4. If the update is rejected (e.g. invalid transition, cancelled order, refund lock),
 *      the script automatically reverts the cell back to the authoritative database value.
 * - Programmatic API updates from the SHOPY server (via service account) do NOT trigger Apps Script onEdit,
 *   which completely prevents infinite request loops!
 */

var SHOPY_CONFIG = {
  // Replace with your production domain or ngrok tunnel
  API_URL: "https://your-shopy-domain.vercel.app",

  // Secret token matching GOOGLE_SHEETS_WEBHOOK_SECRET in .env.local
  WEBHOOK_SECRET: "shopy_sheets_sync_secret_key_2026",

  // Target Worksheet and Columns
  SHEET_NAME: "Orders",
  ORDER_REF_COL: 1,      // Column A (Order Reference)
  PAYMENT_STATUS_COL: 12, // Column L (Payment Status)
  ORDER_STATUS_COL: 13,   // Column M (Order Status)
};

/**
 * Main Installable On-Edit Handler
 */
function installedOnEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== SHOPY_CONFIG.SHEET_NAME) return;

  var row = e.range.getRow();
  var col = e.range.getColumn();

  // Ignore header row edits
  if (row <= 1) return;

  // Only trigger on Payment Status (Col 12) or Order Status (Col 13) edits
  var isPaymentEdit = col === SHOPY_CONFIG.PAYMENT_STATUS_COL;
  var isOrderEdit = col === SHOPY_CONFIG.ORDER_STATUS_COL;

  if (!isPaymentEdit && !isOrderEdit) return;

  var newValue = String(e.value || "").trim().toUpperCase();
  var oldValue = String(e.oldValue || "").trim().toUpperCase();

  // If value didn't actually change, do nothing
  if (newValue === oldValue || !newValue) return;

  // Get Order Reference from Column A of the edited row
  var orderRef = String(sheet.getRange(row, SHOPY_CONFIG.ORDER_REF_COL).getValue() || "").trim();
  if (!orderRef) return;

  var userEmail = Session.getActiveUser().getEmail() || "Google Sheets Admin";

  var payload = {
    orderReference: orderRef,
    paymentStatus: isPaymentEdit ? newValue : undefined,
    orderStatus: isOrderEdit ? newValue : undefined,
    notes: "Updated from Google Sheet by " + userEmail,
    adminEmail: userEmail,
    adminName: "Google Sheets Admin (" + userEmail + ")",
    idempotencyKey: "sheets_" + orderRef + "_" + (isPaymentEdit ? "pay_" + newValue : "ord_" + newValue) + "_" + new Date().getTime(),
  };

  try {
    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-sheets-secret": SHOPY_CONFIG.WEBHOOK_SECRET,
        "Authorization": "Bearer " + SHOPY_CONFIG.WEBHOOK_SECRET,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var endpoint = SHOPY_CONFIG.API_URL.replace(/\/+$/, "") + "/api/webhooks/sheets";
    var response = UrlFetchApp.fetch(endpoint, options);
    var statusCode = response.getResponseCode();
    var responseBody = {};

    try {
      responseBody = JSON.parse(response.getContentText());
    } catch (parseErr) {
      responseBody = { error: response.getContentText() };
    }

    if (statusCode >= 200 && statusCode < 300 && responseBody.success) {
      // Success! Update Last Updated timestamp column (Column R, col 18) in PKT format
      var formattedNow = Utilities.formatDate(new Date(), "Asia/Karachi", "dd/MM/yyyy, hh:mm:ss a");
      sheet.getRange(row, 18).setValue(formattedNow);
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "Order " + orderRef + " synchronized with Supabase: " + (isPaymentEdit ? responseBody.newPaymentStatus : responseBody.newOrderStatus),
        "SHOPY Sync Success",
        4
      );
    } else {
      // Transition rejected or error -> Revert cell to authoritative database state
      var fallbackValue = isPaymentEdit
        ? (responseBody.currentPaymentStatus || oldValue || "UNPAID")
        : (responseBody.currentOrderStatus || oldValue || "CONFIRMED");

      e.range.setValue(fallbackValue);

      var errorMsg = responseBody.error || "Transition rejected by database rules.";
      SpreadsheetApp.getUi().alert("SHOPY Synchronization Warning", errorMsg, SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (netErr) {
    Logger.log("SHOPY Sheets Sync Error: " + netErr.toString());
    // Revert to old value on network error
    if (oldValue) {
      e.range.setValue(oldValue);
    }
    SpreadsheetApp.getActiveSpreadsheet().toast("Network error syncing with SHOPY: " + netErr.message, "Sync Error", 5);
  }
}

/**
 * Diagnostic test function: Run this manually in Apps Script to verify connectivity.
 */
function testShopyConnection() {
  var options = {
    method: "get",
    headers: {
      "x-sheets-secret": SHOPY_CONFIG.WEBHOOK_SECRET,
    },
    muteHttpExceptions: true,
  };

  var endpoint = SHOPY_CONFIG.API_URL.replace(/\/+$/, "") + "/api/webhooks/sheets";
  var res = UrlFetchApp.fetch(endpoint, options);
  Logger.log("Status: " + res.getResponseCode());
  Logger.log("Response: " + res.getContentText());
  SpreadsheetApp.getUi().alert("Connection Test: HTTP " + res.getResponseCode() + "\n" + res.getContentText());
}
