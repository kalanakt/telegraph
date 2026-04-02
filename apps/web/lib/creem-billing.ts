import crypto from "node:crypto";
import type { FlatCheckoutCompleted, FlatSubscriptionEvent } from "@creem_io/nextjs";
import { normalizePlanKey, type PlanKey } from "@telegram-builder/shared";
import { prisma } from "./prisma";
import { createCreemClient, getCreemApiKey, getCreemProProductId } from "./creem";

type TelegraphSubscriptionStatus =
  | "active"
  | "trialing"
  | "paid"
  | "past_due"
  | "scheduled_cancel"
  | "unpaid"
  | "paused"
  | "expired"
  | "canceled"
  | "inactive";

type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;

type RedirectSyncResult =
  | { status: "noop" }
  | { status: "success" }
  | { status: "invalid_signature" }
  | { status: "missing_params" }
  | { status: "product_mismatch" };

type SubscriptionMirrorInput = {
  appUserId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  productId?: string | null;
  plan: PlanKey;
  status: TelegraphSubscriptionStatus;
  activeAt?: Date | null;
  pastDueAt?: Date | null;
  currentPeriodEnd?: Date | null;
  canceledAt?: Date | null;
};

type SubscriptionLookupInput = {
  referenceId?: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
  subscriptionId?: string | null;
};

type RedirectDetails = {
  checkoutId: string | null;
  customerId: string | null;
  productId: string | null;
  requestId: string | null;
  signature: string | null;
  subscriptionId: string | null;
  orderId: string | null;
};

const TERMINAL_FREE_STATUSES = new Set(["paused", "expired", "canceled"]);
const ACTIVE_PRO_STATUSES = new Set(["active", "trialing", "paid", "past_due", "scheduled_cancel", "unpaid"]);

function firstValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

function hasStringValue(pair: [string, string | null]): pair is [string, string] {
  return Boolean(pair[1]);
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapProductIdToPlan(productId?: string | null): PlanKey {
  const configuredProductId = getCreemProProductId();

  if (configuredProductId && productId === configuredProductId) {
    return "PRO";
  }

  return "FREE";
}

function normalizeStatus(value?: string | null): TelegraphSubscriptionStatus {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "active":
    case "trialing":
    case "paid":
    case "past_due":
    case "scheduled_cancel":
    case "unpaid":
    case "paused":
    case "expired":
    case "canceled":
      return normalized;
    default:
      return "inactive";
  }
}

function resolvePlanForStatus(status: TelegraphSubscriptionStatus, productId?: string | null): PlanKey {
  if (TERMINAL_FREE_STATUSES.has(status)) {
    return "FREE";
  }

  if (ACTIVE_PRO_STATUSES.has(status)) {
    return mapProductIdToPlan(productId);
  }

  return "FREE";
}

function extractReferenceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const value = metadata?.referenceId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function findAppUserForBillingEvent(input: SubscriptionLookupInput) {
  if (input.referenceId) {
    const byId = await prisma.user.findUnique({
      where: { id: input.referenceId },
      select: { id: true, email: true, clerkUserId: true, subscription: true }
    });

    if (byId) {
      return byId;
    }
  }

  if (input.subscriptionId) {
    const bySubscription = await prisma.subscription.findUnique({
      where: { creemSubscriptionId: input.subscriptionId },
      select: {
        user: {
          select: { id: true, email: true, clerkUserId: true, subscription: true }
        }
      }
    });

    if (bySubscription?.user) {
      return bySubscription.user;
    }
  }

  if (input.customerId) {
    const byCustomer = await prisma.subscription.findUnique({
      where: { creemCustomerId: input.customerId },
      select: {
        user: {
          select: { id: true, email: true, clerkUserId: true, subscription: true }
        }
      }
    });

    if (byCustomer?.user) {
      return byCustomer.user;
    }
  }

  if (input.customerEmail) {
    return prisma.user.findFirst({
      where: { email: input.customerEmail },
      select: { id: true, email: true, clerkUserId: true, subscription: true }
    });
  }

  return null;
}

async function upsertSubscriptionMirror(input: SubscriptionMirrorInput) {
  await prisma.subscription.upsert({
    where: { userId: input.appUserId },
    create: {
      userId: input.appUserId,
      creemCustomerId: input.customerId ?? undefined,
      creemSubscriptionId: input.subscriptionId ?? undefined,
      creemProductId: input.productId ?? undefined,
      plan: input.plan,
      status: input.status,
      activeAt: input.activeAt ?? undefined,
      pastDueAt: input.pastDueAt ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      canceledAt: input.canceledAt ?? undefined
    },
    update: {
      creemCustomerId: input.customerId ?? undefined,
      creemSubscriptionId: input.subscriptionId ?? undefined,
      creemProductId: input.productId ?? undefined,
      plan: input.plan,
      status: input.status,
      activeAt: input.activeAt ?? undefined,
      pastDueAt: input.pastDueAt ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      canceledAt: input.canceledAt ?? undefined
    }
  });
}

function buildMirrorFromSubscriptionEvent(
  eventType: string,
  data: Pick<
    FlatSubscriptionEvent<string>,
    "customer" | "current_period_end_date" | "canceled_at" | "id" | "metadata" | "product" | "status" | "created_at"
  >
) {
  const baseStatus =
    eventType === "subscription.scheduled_cancel"
      ? "scheduled_cancel"
      : normalizeStatus(data.status);

  const status =
    eventType === "subscription.update" && data.canceled_at ? "scheduled_cancel" : baseStatus;
  const productId = data.product?.id ?? null;
  const plan = resolvePlanForStatus(status, productId);

  return {
    customerId: data.customer?.id ?? null,
    subscriptionId: data.id,
    productId,
    plan,
    status,
    activeAt: status === "inactive" ? null : toDate(data.created_at),
    pastDueAt: status === "past_due" || status === "unpaid" ? new Date() : null,
    currentPeriodEnd: toDate(data.current_period_end_date),
    canceledAt: toDate(data.canceled_at)
  };
}

function buildMirrorFromCheckout(data: FlatCheckoutCompleted) {
  const productId = data.product.id;
  const subscriptionId = data.subscription?.id ?? null;
  const customerId = data.customer?.id ?? null;
  const subscriptionStatus = normalizeStatus(data.subscription?.status ?? "active");

  return {
    customerId,
    subscriptionId,
    productId,
    plan: resolvePlanForStatus(subscriptionStatus, productId),
    status: subscriptionStatus,
    activeAt: toDate(data.subscription?.created_at ?? Date.now()),
    pastDueAt: null,
    currentPeriodEnd: toDate(data.subscription?.current_period_end_date),
    canceledAt: toDate(data.subscription?.canceled_at)
  };
}

function readRedirectDetails(searchParams: SearchParamRecord): RedirectDetails {
  return {
    checkoutId: firstValue(searchParams.checkout_id),
    customerId: firstValue(searchParams.customer_id),
    productId: firstValue(searchParams.product_id),
    requestId: firstValue(searchParams.request_id),
    signature: firstValue(searchParams.signature),
    subscriptionId: firstValue(searchParams.subscription_id),
    orderId: firstValue(searchParams.order_id)
  };
}

export function getBillingReturnState(searchParams: SearchParamRecord) {
  const value = firstValue(searchParams.billing);

  if (value === "missing-email") {
    return {
      tone: "warning" as const,
      message: "Add an email address to your account before starting checkout."
    };
  }

  if (value === "portal-unavailable") {
    return {
      tone: "warning" as const,
      message: "Billing portal is not available until your Creem customer record is synced."
    };
  }

  return null;
}

export function hasCheckoutReturnParams(searchParams: SearchParamRecord) {
  const details = readRedirectDetails(searchParams);
  return Boolean(details.checkoutId || details.subscriptionId || details.customerId || details.signature);
}

export function verifyCheckoutRedirectSignature(searchParams: SearchParamRecord) {
  const apiKey = getCreemApiKey();
  const details = readRedirectDetails(searchParams);

  if (!apiKey || !details.signature) {
    return false;
  }

  const signedPairsInput: Array<[string, string | null]> = [
    ["checkout_id", details.checkoutId],
    ["order_id", details.orderId],
    ["subscription_id", details.subscriptionId],
    ["customer_id", details.customerId],
    ["product_id", details.productId],
    ["request_id", details.requestId]
  ];

  const signedPairs = signedPairsInput
    .filter(hasStringValue)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  const payload = signedPairs.map(([key, value]) => `${key}=${value}`).join("&");
  const computed = crypto.createHmac("sha256", apiKey).update(payload).digest("hex");

  if (computed.length !== details.signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(details.signature));
}

export async function syncSubscriptionMirrorFromCheckoutReturn(input: {
  appUserId: string;
  searchParams: SearchParamRecord;
}): Promise<RedirectSyncResult> {
  const details = readRedirectDetails(input.searchParams);

  if (!details.checkoutId || !details.customerId || !details.productId || !details.subscriptionId || !details.signature) {
    return { status: "missing_params" };
  }

  if (!verifyCheckoutRedirectSignature(input.searchParams)) {
    return { status: "invalid_signature" };
  }

  if (mapProductIdToPlan(details.productId) !== "PRO") {
    return { status: "product_mismatch" };
  }

  try {
    const creem = createCreemClient();
    const subscription = await creem.subscriptions.get(details.subscriptionId);
    const status = normalizeStatus(subscription.status);

    await upsertSubscriptionMirror({
      appUserId: input.appUserId,
      customerId: normalizeNullableString(
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id
      ) ?? details.customerId,
      subscriptionId: subscription.id,
      productId: normalizeNullableString(
        typeof subscription.product === "string" ? subscription.product : subscription.product?.id
      ) ?? details.productId,
      plan: resolvePlanForStatus(
        status === "canceled" && subscription.currentPeriodEndDate && new Date(subscription.currentPeriodEndDate) > new Date()
          ? "scheduled_cancel"
          : status,
        details.productId
      ),
      status:
        status === "canceled" && subscription.currentPeriodEndDate && new Date(subscription.currentPeriodEndDate) > new Date()
          ? "scheduled_cancel"
          : status,
      activeAt: toDate(subscription.createdAt),
      pastDueAt: status === "unpaid" ? new Date() : null,
      currentPeriodEnd: toDate(subscription.currentPeriodEndDate),
      canceledAt: toDate(subscription.canceledAt)
    });

    return { status: "success" };
  } catch {
    await upsertSubscriptionMirror({
      appUserId: input.appUserId,
      customerId: details.customerId,
      subscriptionId: details.subscriptionId,
      productId: details.productId,
      plan: "PRO",
      status: "active"
    });

    return { status: "success" };
  }
}

export async function syncSubscriptionMirrorFromCheckoutCompleted(data: FlatCheckoutCompleted) {
  const metadata = (data.metadata ?? null) as Record<string, unknown> | null;
  const user = await findAppUserForBillingEvent({
    referenceId: extractReferenceId(metadata),
    customerId: data.customer?.id ?? null,
    customerEmail: data.customer?.email ?? null,
    subscriptionId: data.subscription?.id ?? null
  });

  if (!user) {
    return false;
  }

  const mapped = buildMirrorFromCheckout(data);
  await upsertSubscriptionMirror({
    appUserId: user.id,
    ...mapped
  });

  return true;
}

export async function syncSubscriptionMirrorFromSubscriptionEvent(data: FlatSubscriptionEvent<string>) {
  const metadata = (data.metadata ?? null) as Record<string, unknown> | null;
  const user = await findAppUserForBillingEvent({
    referenceId: extractReferenceId(metadata),
    customerId: data.customer?.id ?? null,
    customerEmail: data.customer?.email ?? null,
    subscriptionId: data.id
  });

  if (!user) {
    return false;
  }

  const mapped = buildMirrorFromSubscriptionEvent(data.webhookEventType, data);
  await upsertSubscriptionMirror({
    appUserId: user.id,
    ...mapped
  });

  return true;
}

export function mapCreemProductIdToPlanKey(productId?: string | null): PlanKey {
  return mapProductIdToPlan(productId);
}

export function resolveCreemEventPlanStatus(input: {
  eventType: string;
  productId?: string | null;
  status?: string | null;
}) {
  const status =
    input.eventType === "subscription.scheduled_cancel"
      ? "scheduled_cancel"
      : input.eventType === "subscription.update" && normalizeStatus(input.status) === "canceled"
        ? "scheduled_cancel"
        : normalizeStatus(input.status);

  return {
    plan: resolvePlanForStatus(status, input.productId),
    status
  };
}
