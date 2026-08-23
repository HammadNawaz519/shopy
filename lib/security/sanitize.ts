export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Strip HTML tag angle brackets
    .slice(0, 1000); // Prevent unbounded string length attacks
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Prevent open redirect attacks by only allowing relative paths that do not start with '//' or '\'
  return url.startsWith("/") && !url.startsWith("//") && !url.includes("\\");
}

export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return "";
  return query
    .trim()
    .replace(/[%_\\]/g, "") // Prevent SQL wildcard injection attempts
    .slice(0, 100);
}
