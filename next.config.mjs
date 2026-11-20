import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL || '').startsWith('https://');

// Content Security Policy: only this site's scripts/styles, Google Fonts (self-hosted by next/font),
// images from this site or https, and the Google Maps frame. Inline scripts are needed by Next.js itself.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net",
  'frame-src https://www.google.com https://maps.google.com https://www.googletagmanager.com',
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd && isHttps ? ['upgrade-insecure-requests'] : []),
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Pin the project root so Next doesn't pick up a lockfile from a parent folder
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  // Excel / PDF exports: these libraries read their own data files from node_modules, so they are loaded
  // from there instead of being bundled; the PDF fonts are shipped with the export route.
  serverExternalPackages: ['pdfkit', 'exceljs'],
  outputFileTracingIncludes: {
    '/api/contact/export': ['./src/server/fonts/**/*'],
    '/campus/holidays/pdf': ['./src/server/fonts/**/*'],
    '/campus/academic-calendar/pdf': ['./src/server/fonts/**/*'],
  },
  images: {
    // AVIF first (smallest), WebP as fallback — big savings on slow mobile connections
    formats: ['image/avif', 'image/webp'],
    qualities: [50, 60, 75, 85],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
    // Optimised copies are kept for 30 days (uploads have unique file names, so they never go stale)
    minimumCacheTTL: 2592000,
    // Photos added in the dashboard as https:// links
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      // Built files and site images change name/rarely — let browsers keep them
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
      { source: '/logos/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
      // Private areas are never cached by browsers or proxies
      { source: '/dashboard/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
