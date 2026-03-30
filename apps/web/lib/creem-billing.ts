import { normalizePlanKey, type PlanKey } from "@telegram-builder/shared";
import { prisma } from "./prisma";
import type { CreemWebhookEvent } from "./creem";

type JsonRecord = Record<string, unknown>;

function toRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : null;
}

function getString(record: JsonRecord | null, ...keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function getNestedId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  const record = toRecord(value);
  return getString(record, "id");
}

export function mapCreemProductIdToPlanKey(productId?: string | null): PlanKey {
  const proProduct = (process.env.CREEM_PRO_PRODUCT_ID ?? "").trim();
  if (!proProduct) {
    return "FREE";
  }

  if (!productId) {
    return "FREE";
  }

  return productId === proProduct ? "PRO" : "FREE";
}

function extractReferenceId(metadata: JsonRecord | null): string | null {
  return getString(metadata, "referenceId", "reference_id", "internal_customer_id", "userId", "user_id");
}

function resolveEventMetadata(eventType: string, object: JsonRecord): JsonRecord | null {
  const direct = toRecord(object.metadata);
  if (direct) return direct;

  if (eventType === "checkout.completed") {
    const subscription = toRecord(object.subscription);
    const nested = subscription ? toRecord(subscription.metadata) : null;
    if (nested) return nested;
  }

  return null;
}

function resolveEventProductId(eventType: string, object: JsonRecord): string | null {
  const direct = getNestedId(object.product);
  if (direct) return direct;

  if (eventType === "checkout.completed") {
    const order = toRecord(object.order);
    const orderProduct = order ? getNestedId(order.product) : null;
    if (orderProduct) return orderProduct;
  }

  const subscription = toRecord(object.subscription);
  if (subscription) {
    return getNestedId(subscription.product);
  }

  return null;
}

function resolveEventCustomerId(eventType: string, object: JsonRecord): string | null {
  const direct = getNestedId(object.customer);
  if (direct) return direct;

  if (eventType === "checkout.completed") {
    const order = toRecord(object.order);
    const orderCustomer = order ? getNestedId(order.customer) : null;
    if (orderCustomer) return orderCustomer;
  }

  const subscription = toRecord(object.subscription);
  if (subscription) {
    return getNestedId(subscription.customer);
  }

  return null;
}

function resolveEventSubscriptionId(eventType: string, object: JsonRecord): string | null {
  if (eventType.startsWith("subscription.")) {
    return getString(object, "id");
  }

  if (eventType === "checkout.completed") {
    const subscription = toRecord(object.subscription);
    return subscription ? getString(subscription, "id") : null;
  }

  return null;
}

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function resolveCurrentPeriodEnd(object: JsonRecord): Date | null {
  return parseIsoDate(object.current_period_end_date);
}

function resolveActiveAt(object: JsonRecord): Date | null {
  return parseIsoDate(object.created_at);
}

function resolveCanceledAt(object: JsonRecord): Date | null {
  return parseIsoDate(object.canceled_at);
}

function resolveStatus(eventType: string, object: JsonRecord): string {
  const status = getString(object, "status");
  return status ?? eventType;
}

export async function syncSubscriptionFromCreemEvent(event: CreemWebhookEvent): Promise<void> {
  const object = toRecord(event.object);
  if (!object) {
    return;
  }

  const metadata = resolveEventMetadata(event.eventType, object);
  const referenceId = extractReferenceId(metadata);
  if (!referenceId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: referenceId },
    select: { id: true }
  });
  if (!user) {
    return;
  }

  const productId = resolveEventProductId(event.eventType, object);
  const customerId = resolveEventCustomerId(event.eventType, object);
  const subscriptionId = resolveEventSubscriptionId(event.eventType, object);
  const status = resolveStatus(event.eventType, object);
  const currentPeriodEnd = resolveCurrentPeriodEnd(object);
  const activeAt = resolveActiveAt(object);
  const canceledAt = resolveCanceledAt(object);

  const grantEvents = new Set(["subscription.active", "subscription.trialing", "subscription.paid", "checkout.completed"]);
  const revokeEvents = new Set(["subscription.expired", "subscription.paused"]);

  const nextPlan: PlanKey | null = grantEvents.has(event.eventType)
    ? mapCreemProductIdToPlanKey(productId)
    : revokeEvents.has(event.eventType)
      ? "FREE"
      : null;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: normalizePlanKey(nextPlan ?? "FREE"),
      status,
      creemCustomerId: customerId,
      creemSubscriptionId: subscriptionId,
      creemProductId: productId,
      activeAt,
      currentPeriodEnd,
      canceledAt
    },
    update: {
      ...(nextPlan ? { plan: normalizePlanKey(nextPlan) } : {}),
      status,
      creemCustomerId: customerId ?? undefined,
      creemSubscriptionId: subscriptionId ?? undefined,
      creemProductId: productId ?? undefined,
      activeAt: activeAt ?? undefined,
      currentPeriodEnd: currentPeriodEnd ?? undefined,
      canceledAt: canceledAt ?? undefined
    }
  });
}

