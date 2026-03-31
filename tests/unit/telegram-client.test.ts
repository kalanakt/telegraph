import { describe, expect, it, vi } from "vitest";
import { requestTelegram } from "@telegram-builder/shared";

describe("requestTelegram", () => {
  it("surfaces Telegram JSON error descriptions on HTTP 400", async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () =>
          JSON.stringify({
            ok: false,
            error_code: 400,
            description: "Bad Request: wrong file identifier/HTTP URL specified"
          })
      } as unknown as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestTelegram("TEST_TOKEN", "sendPhoto", { chat_id: 123, photo: "not-a-real-photo" });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(400);
    expect(result.description).toContain("wrong file identifier");
  });

  it("falls back to HTTP status text when response body is not JSON", async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => "not-json"
      } as unknown as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestTelegram("TEST_TOKEN", "sendPhoto", { chat_id: 123, photo: "x" });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(400);
    expect(result.description).toBe("Bad Request");
  });

  it("returns ok results when Telegram responds with JSON", async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            ok: true,
            result: { message_id: 1 }
          })
      } as unknown as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestTelegram("TEST_TOKEN", "sendMessage", { chat_id: 123, text: "hi" });
    expect(result.ok).toBe(true);
    expect(result.errorCode).toBeUndefined();
    expect(result.result).toEqual({ message_id: 1 });
  });
});

