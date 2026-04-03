import { createHash, randomBytes } from "node:crypto";
import { decrypt, encrypt, type JsonValue, type WebhookReceivedEvent } from "@telegram-builder/shared";

const DEFAULT_SIGNATURE_HEADER = "x-telegraph-flow-secret";

export function createWebhookEndpointId() {
  return `flow_${randomBytes(8).toString("hex")}`;
}

export function createWebhookSecret() {
  return randomBytes(24).toString("hex");
}

export function getWebhookSignatureHeaderName(header?: string | null) {
  return (header?.trim() || DEFAULT_SIGNATURE_HEADER).toLowerCase();
}

export function parseWebhookSecret(record: { encryptedSecret: string | null }) {
  return record.encryptedSecret ? decrypt(record.encryptedSecret) : null;
}

export function serializeWebhookSecret(secret: string | null) {
  return secret ? encrypt(secret) : null;
}

export function buildWebhookEvent(input: {
  endpointId: string;
  requestId: string;
  url: URL;
  method: string;
  headers: Headers;
  bodyRaw: string;
  body: JsonValue | null;
}): WebhookReceivedEvent {
  return {
    source: "webhook",
    trigger: "webhook.received",
    eventId: input.requestId,
    updateId: hashToInt(input.requestId),
    webhookEndpointId: input.endpointId,
    method: input.method.toUpperCase(),
    path: input.url.pathname,
    headers: Object.fromEntries(input.headers.entries()),
    query: Object.fromEntries(input.url.searchParams.entries()),
    body: input.body,
    bodyRaw: input.bodyRaw,
    text: input.bodyRaw,
    variables: {}
  };
}

export function makeWebhookRequestId(endpointId: string, bodyRaw: string, idempotencyKey?: string | null) {
  return idempotencyKey?.trim() || `${endpointId}:${createHash("sha256").update(bodyRaw).digest("hex")}`;
}

function hashToInt(value: string) {
  return parseInt(createHash("sha256").update(value).digest("hex").slice(0, 8), 16);
}
