import * as Sentry from "@sentry/nextjs";
import { getWebRuntimeEnv } from "@/lib/env";

const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0");

export async function register() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: true,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  });

  try {
    getWebRuntimeEnv();
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        area: "boot-config",
        service: "web"
      }
    });
    throw error;
  }
}

export const onRequestError = Sentry.captureRequestError;
