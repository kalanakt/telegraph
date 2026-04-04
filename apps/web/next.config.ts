import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/
});

const contentsquareEnabled = process.env.ENABLE_CONTENTSQUARE === "true";

function buildCsp() {
  const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"];

  if (contentsquareEnabled) {
    scriptSources.push("https://t.contentsquare.net");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    `script-src ${scriptSources.join(" ")}`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "form-action 'self' https:",
    "upgrade-insecure-requests"
  ].join("; ");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["bullmq", "ioredis", "@prisma/client"],
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT
  },
  async headers() {
    const headers = [
      { key: "Content-Security-Policy", value: buildCsp() },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
    ];

    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload"
      });
    }

    return [
      {
        source: "/:path*",
        headers
      }
    ];
  }
};

export default withSentryConfig(withMDX(nextConfig), {
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true
    }
  }
});
