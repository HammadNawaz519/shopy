/**
 * SHOPY Google Sheets Live Synchronization Configuration
 * Server-only environment variable parsing with zero-leak guarantees.
 */

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
  isConfigured: boolean;
}

function cleanEnv(value: string | undefined, fallback: string = ""): string {
  if (!value) return fallback;
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const spreadsheetId = cleanEnv(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID
  );
  const clientEmail = cleanEnv(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL
  );

  let rawKey = cleanEnv(
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY
  );

  // Normalize escaped newlines from environment variables
  if (rawKey.includes("\\n")) {
    rawKey = rawKey.replace(/\\n/g, "\n");
  }

  const isConfigured = Boolean(spreadsheetId && clientEmail && rawKey);

  return {
    spreadsheetId,
    clientEmail,
    privateKey: rawKey,
    isConfigured,
  };
}
