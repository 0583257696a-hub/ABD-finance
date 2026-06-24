import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/pg-cloudflare/dist/**/*',
      './node_modules/pg-cloudflare/esm/**/*',
    ],
  },
};

export default nextConfig;
