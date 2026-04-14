import { describe, expect, it } from "vitest";
import { formatBillingPeriodEndLabel } from "@/lib/billing-display";

describe("formatBillingPeriodEndLabel", () => {
  it("formats billing dates in a timezone-stable way", () => {
    expect(formatBillingPeriodEndLabel("2026-05-14T20:45:27.000Z")).toBe("May 14, 2026");
  });

  it("returns a fallback when the billing date is missing", () => {
    expect(formatBillingPeriodEndLabel(null)).toBe("Not available yet");
  });
});
