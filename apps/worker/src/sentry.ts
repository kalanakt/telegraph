import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0");

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
});

export function captureWorkerException(error: unknown, context?: Sentry.CaptureContext) {
  if (!dsn) {
    return;
  }

  Sentry.captureException(error, context);
}

export async function flushSentry(timeout = 2000) {
  if (!dsn) {
    return true;
  }

  return Sentry.flush(timeout);
}
