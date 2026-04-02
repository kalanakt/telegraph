import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const syncSubscriptionMirrorFromCheckoutCompletedMock = vi.fn();
const syncSubscriptionMirrorFromSubscriptionEventMock = vi.fn();

vi.mock("@/lib/creem-billing", () => ({
  syncSubscriptionMirrorFromCheckoutCompleted: (...args: unknown[]) =>
    syncSubscriptionMirrorFromCheckoutCompletedMock(...args),
  syncSubscriptionMirrorFromSubscriptionEvent: (...args: unknown[]) =>
    syncSubscriptionMirrorFromSubscriptionEventMock(...args)
}));

import { POST } from "@/app/api/webhooks/creem/route";

function makeRequest(body: Record<string, unknown>, secret = "whsec_test") {
  const payload = JSON.stringify(body);
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return new Request("http://localhost/api/webhooks/creem", {
    body: payload,
    headers: {
      "content-type": "application/json",
      "creem-signature": signature
    },
    method: "POST"
  });
}

describe("POST /api/webhooks/creem", () => {
  beforeEach(() => {
    process.env.CREEM_WEBHOOK_SECRET = "whsec_test";
    syncSubscriptionMirrorFromCheckoutCompletedMock.mockReset();
    syncSubscriptionMirrorFromSubscriptionEventMock.mockReset();
  });

  it("accepts checkout completion webhooks", async () => {
    const response = await POST(
      makeRequest({
        created_at: Date.now(),
        eventType: "checkout.completed",
        id: "evt_1",
        object: {
          id: "checkout_1",
          product: { id: "prod_pro", name: "Pro" },
          customer: { id: "cust_1", email: "hello@example.com" },
          subscription: { id: "sub_1", status: "active" }
        }
      })
    );

    expect(response.status).toBe(200);
    expect(syncSubscriptionMirrorFromCheckoutCompletedMock).toHaveBeenCalledTimes(1);
  });

  it("accepts subscription lifecycle webhooks", async () => {
    const response = await POST(
      makeRequest({
        created_at: Date.now(),
        eventType: "subscription.past_due",
        id: "evt_2",
        object: {
          id: "sub_1",
          status: "past_due",
          product: { id: "prod_pro", name: "Pro" },
          customer: { id: "cust_1", email: "hello@example.com" },
          current_period_end_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          canceled_at: null
        }
      })
    );

    expect(response.status).toBe(200);
    expect(syncSubscriptionMirrorFromSubscriptionEventMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid signatures", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/creem", {
        body: JSON.stringify({
          created_at: Date.now(),
          eventType: "subscription.active",
          id: "evt_3",
          object: {}
        }),
        headers: {
          "content-type": "application/json",
          "creem-signature": "invalid"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(400);
    expect(syncSubscriptionMirrorFromCheckoutCompletedMock).not.toHaveBeenCalled();
    expect(syncSubscriptionMirrorFromSubscriptionEventMock).not.toHaveBeenCalled();
  });

  it("ignores unrelated webhook types safely", async () => {
    const response = await POST(
      makeRequest({
        created_at: Date.now(),
        eventType: "refund.created",
        id: "evt_4",
        object: { id: "refund_1" }
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ignored: true, received: true });
  });

  it("returns 400 when the webhook secret is missing", async () => {
    delete process.env.CREEM_WEBHOOK_SECRET;

    const response = await POST(
      makeRequest({
        created_at: Date.now(),
        eventType: "subscription.active",
        id: "evt_5",
        object: {}
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing CREEM_WEBHOOK_SECRET" });
  });
});
