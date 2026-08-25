import { google, sheets_v4 } from "googleapis";
import { getGoogleSheetsConfig } from "./config";

export const SHEET_NAMES = {
  ORDERS: "Orders",
  ORDER_ITEMS: "Order Items",
  EMAIL_ACTIVITY: "Email Activity",
  SYNC_ACTIVITY: "Sync Activity",
} as const;

export const SHEET_HEADERS = {
  [SHEET_NAMES.ORDERS]: [
    "Order Reference",
    "Customer Name",
    "Customer Email",
    "Phone",
    "Products",
    "Quantity",
    "Subtotal",
    "Discount",
    "Shipping",
    "Total",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Tracking Number",
    "Delivery Address",
    "City",
    "Order Date",
    "Last Updated",
  ],
  [SHEET_NAMES.ORDER_ITEMS]: [
    "Order Reference",
    "Product Name",
    "Variant",
    "Size",
    "Color",
    "Quantity",
    "Unit Price",
    "Line Total",
  ],
  [SHEET_NAMES.EMAIL_ACTIVITY]: [
    "Order Reference",
    "Event",
    "Recipient",
    "Status",
    "Timestamp",
    "Error",
  ],
  [SHEET_NAMES.SYNC_ACTIVITY]: [
    "Order Reference",
    "Event",
    "Integration",
    "Status",
    "Attempts",
    "Error",
    "Timestamp",
  ],
};

let cachedSheetsClient: sheets_v4.Sheets | null = null;
let schemaEnsured = false;

/**
 * Returns an authenticated Google Sheets v4 API instance.
 */
export function getSheetsClient(): { sheets: sheets_v4.Sheets; spreadsheetId: string } | null {
  const config = getGoogleSheetsConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (cachedSheetsClient) {
    return { sheets: cachedSheetsClient, spreadsheetId: config.spreadsheetId };
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  cachedSheetsClient = sheets;

  return { sheets, spreadsheetId: config.spreadsheetId };
}

/**
 * Automatically creates the 4 required worksheets and sets up headings, formatting, and filters.
 */
export async function ensureSpreadsheetStructure(): Promise<boolean> {
  if (schemaEnsured) return true;

  const clientInfo = getSheetsClient();
  if (!clientInfo) return false;

  const { sheets, spreadsheetId } = clientInfo;

  try {
    // 1. Fetch metadata of the spreadsheet
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = metadata.data.sheets || [];
    const existingTitles = new Set(
      existingSheets.map((s) => s.properties?.title).filter(Boolean) as string[]
    );

    const requests: sheets_v4.Schema$Request[] = [];
    const targetSheetNames = [
      SHEET_NAMES.ORDERS,
      SHEET_NAMES.ORDER_ITEMS,
      SHEET_NAMES.EMAIL_ACTIVITY,
      SHEET_NAMES.SYNC_ACTIVITY,
    ];

    // If default "Sheet1" exists and "Orders" does not, rename "Sheet1" to "Orders"
    if (existingTitles.has("Sheet1") && !existingTitles.has(SHEET_NAMES.ORDERS)) {
      const sheet1Obj = existingSheets.find((s) => s.properties?.title === "Sheet1");
      if (sheet1Obj?.properties?.sheetId !== undefined) {
        requests.push({
          updateSheetProperties: {
            properties: {
              sheetId: sheet1Obj.properties.sheetId,
              title: SHEET_NAMES.ORDERS,
            },
            fields: "title",
          },
        });
        existingTitles.add(SHEET_NAMES.ORDERS);
        existingTitles.delete("Sheet1");
      }
    }

    // Add missing worksheets
    for (const title of targetSheetNames) {
      if (!existingTitles.has(title)) {
        requests.push({
          addSheet: {
            properties: {
              title,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        });
      }
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
    }

    // 2. Fetch updated metadata to ensure sheet IDs are mapped
    const updatedMetadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetMap = new Map<string, number>();
    for (const s of updatedMetadata.data.sheets || []) {
      if (s.properties?.title && typeof s.properties.sheetId === "number") {
        sheetMap.set(s.properties.title, s.properties.sheetId);
      }
    }

    // 3. Ensure Headings exist for all worksheets without deleting data
    for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
      const headerRange = `'${sheetName}'!A1:Z1`;
      const currentHeaderRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: headerRange,
      });

      const hasHeaders =
        currentHeaderRes.data.values &&
        currentHeaderRes.data.values.length > 0 &&
        currentHeaderRes.data.values[0].length >= headers.length;

      if (!hasHeaders) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A1:${String.fromCharCode(64 + headers.length)}1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [headers],
          },
        });
      }

      // Apply formatting: freeze row 1, bold typography, aesthetic background color (#495464), and filter
      const sheetId = sheetMap.get(sheetName);
      if (sheetId !== undefined) {
        const formatRequests: sheets_v4.Schema$Request[] = [
          // Freeze top row
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: "gridProperties.frozenRowCount",
            },
          },
          // Header style: #495464 background, white bold text
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.286, // ~#495464
                    green: 0.329,
                    blue: 0.392,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 0.957, // ~#F4F4F2
                      green: 0.957,
                      blue: 0.949,
                    },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: "CENTER",
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
            },
          },
        ];

        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests: formatRequests },
          });
        } catch {
          // Non-critical formatting fallback
        }
      }
    }

    schemaEnsured = true;
    return true;
  } catch (err) {
    console.error("[GOOGLE SHEETS INITIALIZATION ERROR]", err);
    return false;
  }
}
