import { normalizePlanKey } from "@telegram-builder/shared";

const billingDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC"
});

function normalizeStatus(value?: string | null) {
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

export function getBillingStatusTone(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "past_due" || normalized === "unpaid" || normalized === "scheduled_cancel") {
    return "warning" as const;
  }

  if (normalized === "canceled" || normalized === "expired" || normalized === "paused") {
    return "secondary" as const;
  }

  return "default" as const;
}

export function getDisplayPlan(plan?: string | null) {
  return normalizePlanKey(plan) === "PRO" ? "Pro" : "Free";
}

export function getDisplayStatus(status?: string | null) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "past_due":
      return "Past due";
    case "scheduled_cancel":
      return "Cancels at period end";
    case "unpaid":
      return "Payment issue";
    default:
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}

export function formatBillingPeriodEndLabel(value?: Date | string | null) {
  if (!value) {
    return "Not available yet";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available yet";
  }

  return billingDateFormatter.format(date);
}
