import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyCreemWebhookMock = vi.fn();
const syncSubscriptionFromCreemEventMock = vi.fn();

vi.mock("@/lib/creem", () => ({
  verifyCreemWebhook: (...args: unknown[]) => verifyCreemWebhookMock(...args)
}));

vi.mock("@/lib/creem-billing", () => ({
  syncSubscriptionFromCreemEvent: (...args: unknown[]) => syncSubscriptionFromCreemEventMock(...args)
}));

import { POST } from "@/app/api/webhooks/creem/route";

function makeRequest() {
  return new Request("http://localhost/api/webhooks/creem", {
    method: "POST",
    body: "{}",
    headers: {
      "creem-signature": "sig"
    }
  });
}

describe("POST /api/webhooks/creem", () => {
  beforeEach(() => {
    process.env.CREEM_WEBHOOK_SECRET = "whsec_test";
    verifyCreemWebhookMock.mockReset();
    syncSubscriptionFromCreemEventMock.mockReset();
  });

  it("accepts valid webhook and syncs subscription", async () => {
    verifyCreemWebhookMock.mockResolvedValue({
      id: "evt_1",
      eventType: "subscription.paid",
      object: { id: "sub_1" }
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(syncSubscriptionFromCreemEventMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("rejects invalid signature", async () => {
    verifyCreemWebhookMock.mockRejectedValue(new Error("Invalid signature"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
    expect(syncSubscriptionFromCreemEventMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "Invalid signature" });
  });

  it("returns 400 when webhook secret is missing", async () => {
    delete process.env.CREEM_WEBHOOK_SECRET;

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(verifyCreemWebhookMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Missing Creem webhook secret"
    });
  });
});

