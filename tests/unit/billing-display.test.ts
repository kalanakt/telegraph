import { describe, expect, it } from "vitest";
import { formatBillingPeriodEndLabel, getBillingPortalState } from "@/lib/billing-display";

describe("formatBillingPeriodEndLabel", () => {
  it("formats billing dates in a timezone-stable way", () => {
    expect(formatBillingPeriodEndLabel("2026-05-14T20:45:27.000Z")).toBe("May 14, 2026");
  });

  it("returns a fallback when the billing date is missing", () => {
    expect(formatBillingPeriodEndLabel(null)).toBe("Not available yet");
  });
});

describe("getBillingPortalState", () => {
  it("returns an inline portal link when the customer is synced", () => {
    expect(getBillingPortalState(true)).toEqual({
      href: "/portal",
      label: "Billing portal"
    });
  });

  it("returns the syncing copy when the customer is not synced", () => {
    expect(getBillingPortalState(false)).toEqual({
      href: null,
      label: "Available after customer sync"
    });
  });
});
