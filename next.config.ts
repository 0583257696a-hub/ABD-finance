import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
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
  },
};

export default nextConfig;
