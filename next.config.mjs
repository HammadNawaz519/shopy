/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Prevents X-Powered-By header leakage
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // Cache optimized images for 1 year; immutable content-addressed keys
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    // Use Next.js default router cache (30s dynamic, 5min static).
  },
  async headers() {
    return [
      {
        // 1. All dynamic pages and routes: Security headers and anti-caching for HTML documents
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
              "font-src 'self' https://fonts.gstatic.com https://vercel.live https://*.vercel.live data:",
              "img-src 'self' data: https://images.unsplash.com https://*.supabase.co https://vercel.live https://*.vercel.live blob:",
              "connect-src 'self' https://vercel.live https://*.vercel.live wss://*.pusher.com https://*.supabase.co",
              "frame-src 'self' https://vercel.live https://*.vercel.live",
              "frame-ancestors 'self' https://vercel.live",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // 2. Next.js static hashed JS/CSS chunks: safe to cache immutably because filename contains unique hash
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 3. Fonts never change during runtime - safe to cache immutably
        source: '/:all*(woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 4. Next.js image optimization endpoint:
        //    Browser: 60s max-age so updated product images appear within 1 minute without a hard refresh.
        //    CDN: 1-year s-maxage — CDN still serves efficiently; it gets a new URL when images change.
        //    stale-while-revalidate: 1 day for CDN only (browser re-fetches after 60s naturally).
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=31536000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // 5. Database media assets endpoint: content-addressed immutable assets
        source: '/api/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable',
          },
        ],
      },
      {
        // 6. Uploads directory: cached public media
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // 7. Static image assets: browser and CDN caching
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
