import { normalizePlanKey, type PlanKey } from "@telegram-builder/shared";
import { clerkClient } from "@clerk/nextjs/server";
import { isClerkConfigured } from "./auth-config";
import { prisma } from "./prisma";

type BillingClient = Awaited<ReturnType<typeof clerkClient>>["billing"];
type SubscriptionLike = Awaited<ReturnType<BillingClient["getUserBillingSubscription"]>>;

const ACTIVE_ITEM_STATUSES = new Set(["active", "past_due", "upcoming", "in_trial"]);

function getProPlanSlugs(): Set<string> {
  const raw = process.env.CLERK_BILLING_PRO_PLAN_SLUGS;
  const values = (raw ?? "pro")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set(values);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return null;
}

function getString(record: Record<string, unknown> | null, ...keys: string[]): string | null {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

function getTimestamp(record: Record<string, unknown> | null, ...keys: string[]): Date | null {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return new Date(value);
    }
  }

  return null;
}

function getSubscriptionItems(subscription: Record<string, unknown> | null): Record<string, unknown>[] {
  if (!subscription) {
    return [];
  }

  const camel = subscription.subscriptionItems;
  if (Array.isArray(camel)) {
    return camel.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }

  const snake = subscription.subscription_items;
  if (Array.isArray(snake)) {
    return snake.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }

  return [];
}

function isActiveItem(item: Record<string, unknown>): boolean {
  const status = getString(item, "status");
  if (!status) {
    return false;
  }
  return ACTIVE_ITEM_STATUSES.has(status.toLowerCase());
}

function getPlanSlugFromItem(item: Record<string, unknown>): string | null {
  const direct = getString(item, "planSlug", "plan_slug");
  if (direct) {
    return direct;
  }

  const plan = toRecord(item.plan);
  return getString(plan, "slug");
}

function getBestPlanSlug(subscription: Record<string, unknown> | null): string | null {
  const items = getSubscriptionItems(subscription);
  if (items.length === 0) {
    return null;
  }

  const active = items.find((item) => isActiveItem(item));
  if (active) {
    return getPlanSlugFromItem(active);
  }

  const first = items[0];
  if (!first) {
    return null;
  }

  return getPlanSlugFromItem(first);
}

export function mapClerkPlanSlugToPlanKey(slug?: string | null): PlanKey {
  if (!slug) {
    return "FREE";
  }

  const normalized = slug.trim().toLowerCase();
  if (getProPlanSlugs().has(normalized)) {
    return "PRO";
  }

  return "FREE";
}

function mapSubscriptionToMirror(subscription: unknown) {
  const record = subscription ? toRecord(subscription) : null;
  const status = getString(record, "status") ?? "inactive";
  const clerkPlanSlug = getBestPlanSlug(record);
  const plan = mapClerkPlanSlugToPlanKey(clerkPlanSlug);

  return {
    clerkSubscriptionId: getString(record, "id"),
    clerkPayerId: getString(record, "payerId", "payer_id"),
    clerkPlanSlug,
    plan,
    status,
    activeAt: getTimestamp(record, "activeAt", "active_at"),
    pastDueAt: getTimestamp(record, "pastDueAt", "past_due_at"),
    currentPeriodEnd: getTimestamp(record, "currentPeriodEnd", "current_period_end", "currentPeriodEndAt", "current_period_end_at"),
    canceledAt: getTimestamp(record, "canceledAt", "canceled_at")
  };
}

export async function fetchUserBillingSubscription(clerkUserId: string): Promise<SubscriptionLike | null> {
  if (!isClerkConfigured()) {
    return null;
  }

  try {
    const client = await clerkClient();
    return await client.billing.getUserBillingSubscription(clerkUserId);
  } catch {
    return null;
  }
}

export async function syncSubscriptionMirrorForUser(input: {
  appUserId: string;
  clerkUserId: string;
  fallbackPlan?: string | null;
  fallbackStatus?: string | null;
}) {
  const subscription = await fetchUserBillingSubscription(input.clerkUserId);
  const mapped = mapSubscriptionToMirror(subscription);
  const plan = subscription ? mapped.plan : normalizePlanKey(input.fallbackPlan);
  const status = subscription ? mapped.status : input.fallbackStatus ?? "inactive";

  await prisma.subscription.upsert({
    where: { userId: input.appUserId },
    create: {
      userId: input.appUserId,
      clerkSubscriptionId: mapped.clerkSubscriptionId,
      clerkPayerId: mapped.clerkPayerId ?? input.clerkUserId,
      clerkPlanSlug: mapped.clerkPlanSlug,
      plan,
      status,
      activeAt: mapped.activeAt,
      pastDueAt: mapped.pastDueAt,
      currentPeriodEnd: mapped.currentPeriodEnd,
      canceledAt: mapped.canceledAt
    },
    update: {
      clerkSubscriptionId: mapped.clerkSubscriptionId,
      clerkPayerId: mapped.clerkPayerId ?? input.clerkUserId,
      clerkPlanSlug: mapped.clerkPlanSlug,
      plan,
      status,
      activeAt: mapped.activeAt ?? undefined,
      pastDueAt: mapped.pastDueAt ?? undefined,
      currentPeriodEnd: mapped.currentPeriodEnd ?? undefined,
      canceledAt: mapped.canceledAt ?? undefined
    }
  });

  return {
    plan,
    status
  };
}

export async function syncSubscriptionMirrorFromWebhookEvent(event: Record<string, unknown>) {
  const data = toRecord(event.data);
  if (!data) {
    return;
  }

  const payerId = getString(data, "payerId", "payer_id");
  if (!payerId || !payerId.startsWith("user_")) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: payerId },
    select: { id: true, clerkUserId: true, subscription: true }
  });

  if (!user) {
    return;
  }

  const mapped = mapSubscriptionToMirror(data);
  const plan = mapped.plan ?? normalizePlanKey(user.subscription?.plan);
  const status = mapped.status ?? user.subscription?.status ?? "inactive";

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      clerkSubscriptionId: mapped.clerkSubscriptionId,
      clerkPayerId: mapped.clerkPayerId ?? payerId,
      clerkPlanSlug: mapped.clerkPlanSlug,
      plan,
      status,
      activeAt: mapped.activeAt,
      pastDueAt: mapped.pastDueAt,
      currentPeriodEnd: mapped.currentPeriodEnd,
      canceledAt: mapped.canceledAt
    },
    update: {
      clerkSubscriptionId: mapped.clerkSubscriptionId,
      clerkPayerId: mapped.clerkPayerId ?? payerId,
      clerkPlanSlug: mapped.clerkPlanSlug,
      plan,
      status,
      activeAt: mapped.activeAt ?? undefined,
      pastDueAt: mapped.pastDueAt ?? undefined,
      currentPeriodEnd: mapped.currentPeriodEnd ?? undefined,
      canceledAt: mapped.canceledAt ?? undefined
    }
  });
}
