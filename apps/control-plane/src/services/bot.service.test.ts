import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchTelegramBotIdentity } from "./bot.service.js";

describe("fetchTelegramBotIdentity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns username when Telegram getMe succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, result: { username: "test_bot" } }),
        {
          status: 200,
        },
      ),
    );

    const result = await fetchTelegramBotIdentity("123:abc");
    expect(result).toEqual({ username: "test_bot" });
  });

  it("throws statusCode 400 for invalid token responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, description: "Unauthorized" }), {
        status: 401,
      }),
    );

    await expect(fetchTelegramBotIdentity("bad")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid Telegram bot token",
    });
  });

  it("throws statusCode 502 when Telegram API is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    await expect(fetchTelegramBotIdentity("any")).rejects.toMatchObject({
      statusCode: 502,
      message: "Telegram API is unreachable",
    });
  });
});
