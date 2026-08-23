import crypto from "crypto";

/**
 * Generates a cryptographically secure numeric OTP of specified length.
 * Uses crypto.randomInt() to eliminate statistical bias and predictability.
 *
 * @param length Defaults to 6 digits
 * @returns Numeric OTP string (e.g. "749210")
 */
export function generateSecureOtp(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  const code = crypto.randomInt(min, max);
  return code.toString();
}

/**
 * Generates a cryptographically secure random token for password resets or verification links.
 *
 * @param bytes Number of random bytes (default 32 -> 64 hex chars)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Strict HTML escaping for user-controlled strings (customer names, product names, addresses, notes)
 * before inserting into email HTML templates. Prevents HTML/script injection in email clients.
 */
export function escapeEmailHtml(input: unknown): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
