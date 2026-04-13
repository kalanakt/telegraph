import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { decryptMock, findUniqueMock, findManyMock, updateMock, handleIncomingEventMock } = vi.hoisted(() => ({
  decryptMock: vi.fn(),
  findUniqueMock: vi.fn(),
  findManyMock: vi.fn(),
  updateMock: vi.fn(),
  handleIncomingEventMock: vi.fn(),
}));

vi.mock("@telegram-builder/shared", async () => {
  const actual = await vi.importActual<typeof import("@telegram-builder/shared")>("@telegram-builder/shared");
  return {
    ...actual,
    decrypt: (...args: unknown[]) => decryptMock(...args),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bot: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
    commerceOrder: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

vi.mock("@/lib/orchestrator/service", () => ({
  getAutomationOrchestrator: () => ({
    handleIncomingEvent: (...args: unknown[]) => handleIncomingEventMock(...args),
  }),
}));

import { POST } from "@/app/api/cryptopay/webhook/[botId]/[secret]/route";

describe("Crypto Pay webhook route", () => {
  beforeEach(() => {
    decryptMock.mockReset();
    findUniqueMock.mockReset();
    findManyMock.mockReset();
    updateMock.mockReset();
    handleIncomingEventMock.mockReset();
  });

  it("updates matching orders and dispatches a cryptopay.invoice_paid event", async () => {
    findUniqueMock.mockResolvedValue({
      encryptedCryptoPayToken: "enc:token",
      encryptedCryptoPayWebhookSecret: "enc:secret",
    });
    decryptMock.mockImplementation((value: string) => {
      if (value === "enc:token") return "crypto_token";
      if (value === "enc:secret") return "secret_123";
      return value;
    });
    findManyMock.mockResolvedValue([
      {
        id: "order_1",
        attributes: { existing: true },
        session: { id: "session_1", chatId: "42" },
        customerProfile: {
          id: "customer_1",
          telegramUserId: BigInt(42),
          chatId: "42",
          username: "alice",
        },
      },
    ]);
    updateMock.mockResolvedValue({ id: "order_1" });
    handleIncomingEventMock.mockResolvedValue({
      accepted: true,
      reason: "processed",
      queuedActions: 1,
      runIds: ["run_1"],
    });

    const body = JSON.stringify({
      update_type: "invoice_paid",
      payload: {
        payload: "premium:crypto:monthly:42:101",
        invoice_id: 101,
        hash: "hash_1",
        status: "paid",
        paid_amount: "25",
        paid_asset: "USDT",
        paid_at: "2026-04-13T10:00:00.000Z",
      },
    });
    const secret = crypto.createHash("sha256").update("crypto_token").digest();
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

    const response = await POST(
      new Request("http://localhost/api/cryptopay/webhook/bot_1/secret_123", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "crypto-pay-api-signature": signature,
        },
        body,
      }),
      { params: Promise.resolve({ botId: "bot_1", secret: "secret_123" }) }
    );

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: expect.objectContaining({
        status: "paid",
        paidAt: new Date("2026-04-13T10:00:00.000Z"),
      }),
    });
    expect(handleIncomingEventMock).toHaveBeenCalledWith({
      botId: "bot_1",
      event: expect.objectContaining({
        source: "cryptopay",
        trigger: "cryptopay.invoice_paid",
        invoicePayload: "premium:crypto:monthly:42:101",
        chatId: "42",
        fromUserId: 42,
        fromUsername: "alice",
        cryptoPayInvoiceId: 101,
        cryptoPayPaidAmount: "25",
        cryptoPayPaidAsset: "USDT",
      }),
      receivedAt: new Date("2026-04-13T10:00:00.000Z"),
    });
  });
});
