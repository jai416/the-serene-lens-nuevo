import type { NextConfig } from "next";
import path from "path"

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "bcrypt"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.openrouter.ai https://api.qvapay.com https://www.qvapay.com https://*.supabase.co https://app.posthog.com https://o4511315853246464.ingest.us.sentry.io",
              "frame-src 'self' https://*.stripe.com",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
