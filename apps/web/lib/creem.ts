import { Creem } from "creem";

function parseBoolean(value: string | undefined) {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function isCreemTestMode() {
  const explicit = process.env.CREEM_TEST_MODE;

  if (explicit !== undefined && explicit !== "") {
    return parseBoolean(explicit);
  }

  const apiKey = process.env.CREEM_API_KEY ?? "";

  // Creem test keys must use the test API endpoint; infer that automatically
  // so local environments do not break when the mode flag is omitted.
  return apiKey.startsWith("creem_test_");
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

export function getCreemProProductIdForInterval(interval?: string | null) {
  if (interval === "yearly") {
    return process.env.CREEM_PRO_YEARLY_PRODUCT_ID ?? getCreemProProductId();
  }

  if (interval === "monthly") {
    return process.env.CREEM_PRO_MONTHLY_PRODUCT_ID ?? getCreemProProductId();
  }

  return getCreemProProductId();
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
