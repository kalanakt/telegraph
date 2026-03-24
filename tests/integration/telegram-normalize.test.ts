import { describe, expect, it } from "vitest";
import { normalizeTelegramUpdate } from "@telegram-builder/shared";

describe("normalizeTelegramUpdate", () => {
  it("normalizes standard message events", () => {
    const normalized = normalizeTelegramUpdate({
      update_id: 999,
      message: {
        message_id: 101,
        chat: { id: 777, type: "private" },
        from: { id: 222 },
        text: "ping"
      }
    });

    expect(normalized).toEqual({
      trigger: "message_received",
      updateId: 999,
      messageId: 101,
      chatId: "777",
      chatType: "private",
      fromUserId: 222,
      messageSource: "user",
      text: "ping",
      variables: {}
    });
  });

  it("normalizes command events", () => {
    const normalized = normalizeTelegramUpdate({
      update_id: 1001,
      message: {
        message_id: 201,
        chat: { id: 777, type: "private" },
        from: { id: 222 },
        text: "/start abc"
      }
    });

    expect(normalized?.trigger).toBe("command_received");
    if (!normalized || normalized.trigger !== "command_received") {
      return;
    }

    expect(normalized.command).toBe("/start");
    expect(normalized.commandArgs).toBe("abc");
  });

  it("normalizes callback query events", () => {
    const normalized = normalizeTelegramUpdate({
      update_id: 3000,
      callback_query: {
        id: "cb_1",
        from: { id: 90 },
        data: "choose:yes",
        message: {
          message_id: 45,
          chat: { id: 808, type: "private" }
        }
      }
    });

    expect(normalized?.trigger).toBe("callback_query_received");
  });

  it("returns null for unsupported updates", () => {
    expect(normalizeTelegramUpdate({ update_id: 1 })).toBeNull();
  });
});
