import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const findFirstMock = vi.fn();
const updateMock = vi.fn();

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

import { PATCH } from "@/app/api/bots/[botId]/settings/route";

describe("PATCH /api/bots/[botId]/settings", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset();
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("updates bot capture settings for the owning user", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({ id: "bot_1", userId: "user_1" });
    updateMock.mockResolvedValue({ id: "bot_1", captureUsersEnabled: true });

    const response = await PATCH(
      new Request("http://localhost/api/bots/bot_1/settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ captureUsersEnabled: true })
      }),
      {
        params: Promise.resolve({ botId: "bot_1" })
      }
    );

    expect(response.status).toBe(200);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        id: "bot_1",
        userId: "user_1"
      }
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "bot_1" },
      data: { captureUsersEnabled: true }
    });
    await expect(response.json()).resolves.toEqual({
      bot: {
        id: "bot_1",
        captureUsersEnabled: true
      }
    });
  });

  it("returns 404 when the bot does not belong to the current user", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/bots/bot_2/settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ captureUsersEnabled: false })
      }),
      {
        params: Promise.resolve({ botId: "bot_2" })
      }
    );

    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
