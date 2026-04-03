import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getWebRuntimeEnv, resetWebRuntimeEnvForTests } from "@/lib/env";
import { getWorkerRuntimeEnv, resetWorkerRuntimeEnvForTests } from "../../apps/worker/src/env";

const originalEnv = { ...process.env };

function applyBaseEnv() {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/telegraph";
  process.env.REDIS_URL = "redis://localhost:6379";
  process.env.ENCRYPTION_KEY = "telegraph_test_encryption_key_32_chars";
  process.env.TELEGRAM_WEBHOOK_BASE_URL = "https://example.com/api/telegram/webhook";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
  process.env.CLERK_SECRET_KEY = "sk_test_123";
  process.env.CREEM_API_KEY = "creem_test_123";
  process.env.CREEM_WEBHOOK_SECRET = "whsec_123";
  process.env.CREEM_PRO_PRODUCT_ID = "prod_123";
  process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN = "telegram-secret";
}

describe("runtime env validation", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = "production";
    applyBaseEnv();
    resetWebRuntimeEnvForTests();
    resetWorkerRuntimeEnvForTests();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetWebRuntimeEnvForTests();
    resetWorkerRuntimeEnvForTests();
  });

  it("accepts a valid production web env", () => {
    expect(getWebRuntimeEnv().isProduction).toBe(true);
  });

  it("fails web validation when the Telegram webhook secret is missing", () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
    resetWebRuntimeEnvForTests();

    expect(() => getWebRuntimeEnv()).toThrow(/TELEGRAM_WEBHOOK_SECRET_TOKEN is required/);
  });

  it("accepts a valid production worker env", () => {
    expect(getWorkerRuntimeEnv().concurrency).toBe(5);
  });
});
