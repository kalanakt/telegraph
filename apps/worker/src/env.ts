import {
  assertRuntimeEnv,
  isProductionRuntime,
  parseIntegerEnv,
  validateUrlEnv
} from "@telegram-builder/shared";

export type WorkerRuntimeEnv = {
  concurrency: number;
  deadLetterRetentionDays: number;
  incomingEventRetentionDays: number;
  retentionSweepIntervalMinutes: number;
  runRetentionDays: number;
};

let cachedEnv: WorkerRuntimeEnv | null = null;

function validateWorkerRuntimeEnv(): WorkerRuntimeEnv {
  const env = process.env;
  const isProduction = isProductionRuntime(env);

  assertRuntimeEnv("worker", env, [
    { name: "DATABASE_URL", required: true },
    { name: "REDIS_URL", required: true },
    {
      name: "REDIS_URL",
      required: true,
      validate: (value) => validateUrlEnv("REDIS_URL", value)
    },
    {
      name: "ENCRYPTION_KEY",
      required: true,
      validate: (value) => (value.length < 32 ? "ENCRYPTION_KEY must be at least 32 characters" : null)
    },
    { name: "TELEGRAM_WEBHOOK_SECRET_TOKEN", required: isProduction }
  ]);

  return {
    concurrency: parseIntegerEnv(env.WORKER_CONCURRENCY, 5, { min: 1, max: 100 }),
    deadLetterRetentionDays: parseIntegerEnv(env.DEAD_LETTER_RETENTION_DAYS, 30, { min: 1, max: 3650 }),
    incomingEventRetentionDays: parseIntegerEnv(env.INCOMING_EVENT_RETENTION_DAYS, 30, { min: 1, max: 3650 }),
    retentionSweepIntervalMinutes: parseIntegerEnv(env.RETENTION_SWEEP_INTERVAL_MINUTES, 360, { min: 5, max: 1440 }),
    runRetentionDays: Math.min(
      parseIntegerEnv(env.WORKFLOW_RUN_RETENTION_DAYS, 180, { min: 1, max: 3650 }),
      parseIntegerEnv(env.ACTION_RUN_RETENTION_DAYS, 180, { min: 1, max: 3650 })
    )
  };
}

export function getWorkerRuntimeEnv() {
  if (!cachedEnv) {
    cachedEnv = validateWorkerRuntimeEnv();
  }

  return cachedEnv;
}

export function resetWorkerRuntimeEnvForTests() {
  cachedEnv = null;
}
