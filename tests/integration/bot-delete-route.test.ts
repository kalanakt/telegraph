import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const findFirstMock = vi.fn();
const deleteMock = vi.fn();
const decryptMock = vi.fn();
const deleteWebhookMock = vi.fn();

vi.mock("@/lib/user", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args)
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bot: {
      delete: (...args: unknown[]) => deleteMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args)
    }
  }
}));

vi.mock("@telegram-builder/shared", async () => {
  const actual = await vi.importActual<typeof import("@telegram-builder/shared")>("@telegram-builder/shared");
  return {
    ...actual,
    decrypt: (...args: unknown[]) => decryptMock(...args),
    telegramDeleteWebhook: (...args: unknown[]) => deleteWebhookMock(...args)
  };
});

import { DELETE } from "@/app/api/bots/[botId]/route";

describe("DELETE /api/bots/[botId]", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset();
    findFirstMock.mockReset();
    deleteMock.mockReset();
    decryptMock.mockReset();
    deleteWebhookMock.mockReset();
  });

  it("deletes a user-owned bot and removes its webhook", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({ id: "bot_1", userId: "user_1", encryptedToken: "encrypted" });
    decryptMock.mockReturnValue("token");
    deleteWebhookMock.mockResolvedValue(true);
    deleteMock.mockResolvedValue({ id: "bot_1" });

    const response = await DELETE(new Request("http://localhost/api/bots/bot_1", { method: "DELETE" }), {
      params: Promise.resolve({ botId: "bot_1" })
    });

    expect(response.status).toBe(200);
    expect(deleteWebhookMock).toHaveBeenCalledWith("token");
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "bot_1" }
    });
    await expect(response.json()).resolves.toEqual({ deleted: true, webhookRemoved: true });
  });
});
