import crypto from "node:crypto";

type JsonRecord = Record<string, unknown>;

export type CreemWebhookEvent = {
  id: string;
  eventType: string;
  created_at?: number;
  object: unknown;
};

export type CreemCheckout = {
  id: string;
  status: string;
  checkout_url: string;
  product?: string;
  request_id?: string;
  success_url?: string;
  metadata?: JsonRecord;
};

export type CreateCheckoutInput = {
  productId: string;
  requestId?: string;
  successUrl?: string;
  customerEmail?: string;
  discountCode?: string;
  units?: number;
  metadata?: JsonRecord;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function getApiKey(): string {
  return requireEnv("CREEM_API_KEY");
}

export function getCreemBaseUrl(): string {
  const apiKey = process.env.CREEM_API_KEY ?? "";
  const explicit = (process.env.CREEM_TEST_MODE ?? "").toLowerCase();
  if (explicit === "1" || explicit === "true" || explicit === "yes") {
    return "https://test-api.creem.io";
  }

  if (apiKey.startsWith("creem_test_")) {
    return "https://test-api.creem.io";
  }

  return "https://api.creem.io";
}

async function creemFetch(path: string, init: RequestInit): Promise<Response> {
  const base = getCreemBaseUrl();
  const url = `${base}${path}`;
  const apiKey = getApiKey();

  const headers = new Headers(init.headers);
  headers.set("x-api-key", apiKey);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return fetch(url, { ...init, headers });
}

export async function createCreemCheckout(input: CreateCheckoutInput): Promise<CreemCheckout> {
  const response = await creemFetch("/v1/checkouts", {
    method: "POST",
    body: JSON.stringify({
      product_id: input.productId,
      request_id: input.requestId,
      success_url: input.successUrl,
      customer: input.customerEmail ? { email: input.customerEmail } : undefined,
      discount_code: input.discountCode,
      units: input.units,
      metadata: input.metadata
    })
  });

  const json = (await response.json()) as unknown;
  if (!response.ok) {
    const message = typeof json === "object" && json !== null && "message" in json ? (json as { message?: unknown }).message : null;
    throw new Error(
      Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : "Creem checkout creation failed"
    );
  }

  return json as CreemCheckout;
}

export async function createCreemCustomerPortalLink(customerId: string): Promise<string> {
  const response = await creemFetch("/v1/customers/billing", {
    method: "POST",
    body: JSON.stringify({ customer_id: customerId })
  });

  const json = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error("Creem portal link creation failed");
  }

  const link =
    typeof json === "object" && json !== null && "customer_portal_link" in json
      ? (json as { customer_portal_link?: unknown }).customer_portal_link
      : null;

  if (typeof link !== "string" || link.length === 0) {
    throw new Error("Creem portal link missing from response");
  }

  return link;
}

export function verifyCreemWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function verifyCreemWebhook(req: Request, webhookSecret: string): Promise<CreemWebhookEvent> {
  const signature = req.headers.get("creem-signature");
  if (!signature) {
    throw new Error("Missing creem-signature header");
  }

  const rawBody = await req.text();
  const ok = verifyCreemWebhookSignature(rawBody, signature, webhookSecret);
  if (!ok) {
    throw new Error("Invalid signature");
  }

  const json = JSON.parse(rawBody) as CreemWebhookEvent;
  if (!json || typeof json !== "object" || typeof json.eventType !== "string") {
    throw new Error("Invalid webhook payload");
  }

  return json;
}

