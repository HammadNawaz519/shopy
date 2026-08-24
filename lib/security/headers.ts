export const SECURITY_HEADERS = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
    "font-src 'self' https://fonts.gstatic.com https://vercel.live https://*.vercel.live data:",
    "img-src 'self' data: https://images.unsplash.com https://vercel.live https://*.vercel.live blob:",
    "connect-src 'self' https://vercel.live https://*.vercel.live wss://*.pusher.com https://*.supabase.co",
    "frame-src 'self' https://vercel.live https://*.vercel.live",
    "frame-ancestors 'self' https://vercel.live",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export function applySecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
}
