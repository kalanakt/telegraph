import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  mapCreemProductIdToPlanKey,
  resolveCreemEventPlanStatus,
  verifyCheckoutRedirectSignature
} from "@/lib/creem-billing";

describe("mapCreemProductIdToPlanKey", () => {
  it("maps the monthly and yearly products to PRO", () => {
    process.env.CREEM_PRO_MONTHLY_PRODUCT_ID = "prod_monthly";
    process.env.CREEM_PRO_YEARLY_PRODUCT_ID = "prod_yearly";

    expect(mapCreemProductIdToPlanKey("prod_monthly")).toBe("PRO");
    expect(mapCreemProductIdToPlanKey("prod_yearly")).toBe("PRO");
  });

  it("maps other products to FREE", () => {
    process.env.CREEM_PRO_MONTHLY_PRODUCT_ID = "prod_monthly";
    process.env.CREEM_PRO_YEARLY_PRODUCT_ID = "prod_yearly";
    expect(mapCreemProductIdToPlanKey("prod_other")).toBe("FREE");
  });
});

describe("resolveCreemEventPlanStatus", () => {
  it("keeps active subscriptions on PRO", () => {
    process.env.CREEM_PRO_MONTHLY_PRODUCT_ID = "prod_monthly";
    process.env.CREEM_PRO_YEARLY_PRODUCT_ID = "prod_yearly";

    expect(
      resolveCreemEventPlanStatus({
        eventType: "subscription.active",
        productId: "prod_monthly",
        status: "active"
      })
    ).toEqual({ plan: "PRO", status: "active" });
  });

  it("marks scheduled cancellation as billable until period end", () => {
    process.env.CREEM_PRO_MONTHLY_PRODUCT_ID = "prod_monthly";
    process.env.CREEM_PRO_YEARLY_PRODUCT_ID = "prod_yearly";

    expect(
      resolveCreemEventPlanStatus({
        eventType: "subscription.scheduled_cancel",
        productId: "prod_yearly",
        status: "canceled"
      })
    ).toEqual({ plan: "PRO", status: "scheduled_cancel" });
  });

  it("downgrades paused subscriptions to FREE", () => {
    process.env.CREEM_PRO_MONTHLY_PRODUCT_ID = "prod_monthly";
    process.env.CREEM_PRO_YEARLY_PRODUCT_ID = "prod_yearly";

    expect(
      resolveCreemEventPlanStatus({
        eventType: "subscription.paused",
        productId: "prod_monthly",
        status: "paused"
      })
    ).toEqual({ plan: "FREE", status: "paused" });
  });
});

describe("verifyCheckoutRedirectSignature", () => {
  it("accepts a valid Creem redirect signature", () => {
    process.env.CREEM_API_KEY = "creem_secret";

    const payload =
      "checkout_id=ch_123&customer_id=cust_123&product_id=prod_pro&request_id=req_123&subscription_id=sub_123";
    const signature = crypto.createHmac("sha256", "creem_secret").update(payload).digest("hex");

    expect(
      verifyCheckoutRedirectSignature({
        checkout_id: "ch_123",
        customer_id: "cust_123",
        product_id: "prod_pro",
        request_id: "req_123",
        signature,
        subscription_id: "sub_123"
      })
    ).toBe(true);
  });

  it("includes order ids in the alphabetically sorted payload when present", () => {
    process.env.CREEM_API_KEY = "creem_secret";

    const payload =
      "checkout_id=ch_123&customer_id=cust_123&order_id=ord_123&product_id=prod_pro&request_id=req_123&subscription_id=sub_123";
    const signature = crypto.createHmac("sha256", "creem_secret").update(payload).digest("hex");

    expect(
      verifyCheckoutRedirectSignature({
        checkout_id: "ch_123",
        customer_id: "cust_123",
        order_id: "ord_123",
        product_id: "prod_pro",
        request_id: "req_123",
        signature,
        subscription_id: "sub_123"
      })
    ).toBe(true);
  });

  it("accepts the legacy Creem redirect signature format", () => {
    process.env.CREEM_API_KEY = "creem_secret";

    const payload =
      "checkout_id=ch_123|order_id=ord_123|customer_id=cust_123|subscription_id=sub_123|product_id=prod_pro|salt=creem_secret";
    const signature = crypto.createHash("sha256").update(payload).digest("hex");

    expect(
      verifyCheckoutRedirectSignature({
        checkout_id: "ch_123",
        customer_id: "cust_123",
        order_id: "ord_123",
        product_id: "prod_pro",
        signature,
        subscription_id: "sub_123"
      })
    ).toBe(true);
  });

  it("rejects an invalid Creem redirect signature", () => {
    process.env.CREEM_API_KEY = "creem_secret";

    expect(
      verifyCheckoutRedirectSignature({
        checkout_id: "ch_123",
        customer_id: "cust_123",
        product_id: "prod_pro",
        signature: "invalid",
        subscription_id: "sub_123"
      })
    ).toBe(false);
  });
});
