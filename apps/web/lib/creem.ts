import { Creem } from "creem";

function parseBoolean(value: string | undefined) {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function isCreemTestMode() {
  return parseBoolean(process.env.CREEM_TEST_MODE);
}

export function getCreemApiKey() {
  return process.env.CREEM_API_KEY ?? "";
}

export function getCreemWebhookSecret() {
  return process.env.CREEM_WEBHOOK_SECRET ?? "";
}

export function getCreemProProductId() {
  return process.env.CREEM_PRO_PRODUCT_ID ?? "";
}

export function createCreemClient() {
  const apiKey = getCreemApiKey();

  if (!apiKey) {
    throw new Error("Missing CREEM_API_KEY");
  }

  return new Creem({
    apiKey,
    serverIdx: isCreemTestMode() ? 1 : 0
  });
}
