import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const findFirstMock = vi.fn();
const updateMock = vi.fn();
const cryptoPayGetMeMock = vi.fn();
const decryptMock = vi.fn();
const encryptMock = vi.fn();

vi.mock("@/lib/user", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args)
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bot: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      update: (...args: unknown[]) => updateMock(...args)
    }
  }
}));

vi.mock("@telegram-builder/shared", async () => {
  const actual = await vi.importActual<typeof import("@telegram-builder/shared")>("@telegram-builder/shared");
  return {
    ...actual,
    cryptoPayGetMe: (...args: unknown[]) => cryptoPayGetMeMock(...args),
    decrypt: (...args: unknown[]) => decryptMock(...args),
    encrypt: (...args: unknown[]) => encryptMock(...args)
  };
});

import { PATCH, POST } from "@/app/api/bots/[botId]/cryptopay/route";

describe("Crypto Pay bot settings route", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset();
    findFirstMock.mockReset();
    updateMock.mockReset();
    cryptoPayGetMeMock.mockReset();
    decryptMock.mockReset();
    encryptMock.mockReset();
  });

  it("preserves the existing webhook secret when reconnecting Crypto Pay", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "bot_1",
      userId: "user_1",
      encryptedCryptoPayWebhookSecret: "enc:old-secret"
    });
    cryptoPayGetMeMock.mockResolvedValue({
      app_id: 42,
      name: "Payments"
    });
    decryptMock.mockImplementation((value: string) => {
      if (value === "enc:old-secret" || value === "enc:stored-secret") {
        return "secret_123";
      }

      return value;
    });
    encryptMock.mockImplementation((value: string) => `enc:${value}`);
    updateMock.mockResolvedValue({
      id: "bot_1",
      encryptedCryptoPayToken: "enc:token_123",
      encryptedCryptoPayWebhookSecret: "enc:stored-secret",
      cryptoPayCustomWebhookUrl: "https://pay.example.com/cryptopay",
      cryptoPayAppId: "42",
      cryptoPayAppName: "Payments",
      cryptoPayUseTestnet: true,
      cryptoPayConnectedAt: new Date("2026-04-13T10:00:00.000Z")
    });

    const response = await POST(
      new Request("http://localhost/api/bots/bot_1/cryptopay", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          token: "token_123",
          useTestnet: true,
          webhookUrl: "https://pay.example.com/cryptopay"
        })
      }),
      {
        params: Promise.resolve({ botId: "bot_1" })
      }
    );

    expect(response.status).toBe(200);
    expect(cryptoPayGetMeMock).toHaveBeenCalledWith("token_123", { useTestnet: true });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "bot_1" },
      data: {
        encryptedCryptoPayToken: "enc:token_123",
        encryptedCryptoPayWebhookSecret: "enc:secret_123",
        cryptoPayCustomWebhookUrl: "https://pay.example.com/cryptopay",
        cryptoPayAppId: "42",
        cryptoPayAppName: "Payments",
        cryptoPayUseTestnet: true,
        cryptoPayConnectedAt: expect.any(Date)
      }
    });
    await expect(response.json()).resolves.toMatchObject({
      connected: true,
      appId: "42",
      appName: "Payments",
      useTestnet: true,
      customWebhookUrl: "https://pay.example.com/cryptopay",
      defaultWebhookUrl: "http://localhost/api/cryptopay/webhook/bot_1/secret_123",
      webhookUrl: "https://pay.example.com/cryptopay"
    });
  });

  it("updates the custom Crypto Pay webhook URL without reconnecting", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "bot_1",
      userId: "user_1",
      encryptedCryptoPayToken: "enc:token",
      encryptedCryptoPayWebhookSecret: "enc:stored-secret",
      cryptoPayCustomWebhookUrl: null,
      cryptoPayAppId: "42",
      cryptoPayAppName: "Payments",
      cryptoPayUseTestnet: false,
      cryptoPayConnectedAt: new Date("2026-04-13T10:00:00.000Z")
    });
    decryptMock.mockImplementation((value: string) => {
      if (value === "enc:stored-secret") {
        return "secret_123";
      }

      return value;
    });
    updateMock.mockResolvedValue({
      id: "bot_1",
      encryptedCryptoPayToken: "enc:token",
      encryptedCryptoPayWebhookSecret: "enc:stored-secret",
      cryptoPayCustomWebhookUrl: "https://billing.example.com/cryptopay",
      cryptoPayAppId: "42",
      cryptoPayAppName: "Payments",
      cryptoPayUseTestnet: false,
      cryptoPayConnectedAt: new Date("2026-04-13T10:00:00.000Z")
    });

    const response = await PATCH(
      new Request("http://localhost/api/bots/bot_1/cryptopay", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          webhookUrl: "https://billing.example.com/cryptopay"
        })
      }),
      {
        params: Promise.resolve({ botId: "bot_1" })
      }
    );

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "bot_1" },
      data: {
        cryptoPayCustomWebhookUrl: "https://billing.example.com/cryptopay"
      }
    });
    await expect(response.json()).resolves.toMatchObject({
      connected: true,
      customWebhookUrl: "https://billing.example.com/cryptopay",
      defaultWebhookUrl: "http://localhost/api/cryptopay/webhook/bot_1/secret_123",
      webhookUrl: "https://billing.example.com/cryptopay"
    });
  });

  it("returns a readable Crypto Pay API error instead of [object Object]", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "bot_1",
      userId: "user_1",
      encryptedCryptoPayWebhookSecret: null
    });
    cryptoPayGetMeMock.mockRejectedValue({
      error: {
        message: "APP_TOKEN_INVALID"
      }
    });

    const response = await POST(
      new Request("http://localhost/api/bots/bot_1/cryptopay", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          token: "bad_token",
          useTestnet: false
        })
      }),
      {
        params: Promise.resolve({ botId: "bot_1" })
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "APP_TOKEN_INVALID"
    });
  });

  it("returns a readable validation error for an invalid custom webhook URL", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "bot_1",
      userId: "user_1",
      encryptedCryptoPayWebhookSecret: null
    });

    const response = await POST(
      new Request("http://localhost/api/bots/bot_1/cryptopay", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          token: "token_123",
          webhookUrl: "not-a-url"
        })
      }),
      {
        params: Promise.resolve({ botId: "bot_1" })
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "webhookUrl: Invalid URL"
    });
  });
});
