import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { isServer }) => {
    // "cloudflare:email" is a Workers runtime built-in (used to send transactional
    // email via the Send Email binding). It only exists inside workerd, so it must
    // never be bundled/resolved by webpack — the OpenNext/Wrangler build step
    // supplies it at deploy time.
    if (isServer) {
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'cloudflare:email']
    }
    return config
  },
  async headers() {
    const securityHeaders = [
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
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "form-action 'self'",
          "img-src 'self' data: blob:",
          "font-src 'self' https://fonts.gstatic.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "connect-src 'self' https:",
          "frame-src 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ]

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
    // Note: /sw.js's Cache-Control is set via public/_headers, not here —
    // it's served as a static asset directly by Cloudflare's ASSETS binding,
    // bypassing the Next.js request pipeline (and this headers() config)
    // entirely. Confirmed live: this rule never actually applied to it.
  },
};

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Registered in production only (Phase 7) — we register it ourselves via a
  // client component for full control over the update-prompt UX, not
  // @serwist/next's built-in auto-registration.
  disable: process.env.NODE_ENV === 'development',
  register: false,
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);
