import { describe, expect, it } from "vitest";
import { getAnalyticsConsent } from "@/lib/analytics";

describe("analytics consent helpers", () => {
  it("returns granted or denied for known values", () => {
    expect(getAnalyticsConsent("granted")).toBe("granted");
    expect(getAnalyticsConsent("denied")).toBe("denied");
  });

  it("falls back to unknown for missing or invalid values", () => {
    expect(getAnalyticsConsent(undefined)).toBe("unknown");
    expect(getAnalyticsConsent("unexpected")).toBe("unknown");
  });
});
