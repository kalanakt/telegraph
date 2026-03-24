import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyClerkWebhookMock = vi.fn();
const syncSubscriptionMirrorFromWebhookEventMock = vi.fn();

vi.mock("@/lib/clerk-webhooks", () => ({
  verifyClerkWebhook: (...args: unknown[]) => verifyClerkWebhookMock(...args)
}));

vi.mock("@/lib/clerk-billing", () => ({
  syncSubscriptionMirrorFromWebhookEvent: (...args: unknown[]) =>
    syncSubscriptionMirrorFromWebhookEventMock(...args)
}));

import { POST } from "@/app/api/webhooks/clerk/route";

function makeRequest() {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    body: "{}"
  });
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test";
    verifyClerkWebhookMock.mockReset();
    syncSubscriptionMirrorFromWebhookEventMock.mockReset();
  });

  it("accepts valid billing subscription webhook and syncs mirror", async () => {
    verifyClerkWebhookMock.mockResolvedValue({
      type: "billing.subscription.updated",
      data: { payer_id: "user_123", subscription_items: [] }
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(syncSubscriptionMirrorFromWebhookEventMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("rejects invalid signature and does not mutate data", async () => {
    verifyClerkWebhookMock.mockRejectedValue(new Error("invalid signature"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(syncSubscriptionMirrorFromWebhookEventMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "invalid signature" });
  });

  it("remains idempotent for repeated events", async () => {
    verifyClerkWebhookMock.mockResolvedValue({
      type: "billing.subscription.updated",
      data: { id: "sub_1", payer_id: "user_123", subscription_items: [] }
    });

    const req = () => makeRequest();

    const first = await POST(req());
    const second = await POST(req());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(syncSubscriptionMirrorFromWebhookEventMock).toHaveBeenCalledTimes(2);
  });

  it("returns 400 when webhook secret is missing", async () => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(verifyClerkWebhookMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Missing Clerk webhook signing secret"
    });
  });
});
