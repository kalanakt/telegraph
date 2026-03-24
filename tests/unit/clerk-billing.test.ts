import { describe, expect, it } from "vitest";
import { mapClerkPlanSlugToPlanKey } from "@/lib/clerk-billing";

describe("mapClerkPlanSlugToPlanKey", () => {
  it("maps pro slug to PRO", () => {
    process.env.CLERK_BILLING_PRO_PLAN_SLUGS = "pro";
    expect(mapClerkPlanSlugToPlanKey("pro")).toBe("PRO");
  });

  it("maps non-pro slug to FREE", () => {
    process.env.CLERK_BILLING_PRO_PLAN_SLUGS = "pro";
    expect(mapClerkPlanSlugToPlanKey("starter")).toBe("FREE");
  });

  it("supports custom pro slug mapping from env", () => {
    process.env.CLERK_BILLING_PRO_PLAN_SLUGS = "pro,business";
    expect(mapClerkPlanSlugToPlanKey("business")).toBe("PRO");
  });

  it("defaults to FREE when slug is empty", () => {
    process.env.CLERK_BILLING_PRO_PLAN_SLUGS = "pro";
    expect(mapClerkPlanSlugToPlanKey(undefined)).toBe("FREE");
    expect(mapClerkPlanSlugToPlanKey(null)).toBe("FREE");
    expect(mapClerkPlanSlugToPlanKey("")).toBe("FREE");
  });
});
