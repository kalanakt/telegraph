import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/
});

const nextConfig: NextConfig = {
  typedRoutes: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["bullmq", "ioredis", "@prisma/client"],
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT
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
