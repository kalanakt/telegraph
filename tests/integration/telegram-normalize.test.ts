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
      source: "telegram",
      trigger: "message_received",
      eventId: "999",
      updateId: 999,
      messageId: 101,
      chatId: "777",
      chatType: "private",
      fromUserId: 222,
      fromUsername: undefined,
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

  it("includes message feature flags for media updates", () => {
    const normalized = normalizeTelegramUpdate({
      update_id: 5000,
      message: {
        message_id: 1,
        chat: { id: 777, type: "private" },
        from: { id: 222 },
        caption: "photo caption",
        photo: [{ file_id: "x", file_unique_id: "y", width: 1, height: 1 }]
      }
    });

    expect(normalized.trigger).toBe("message_received");
    expect((normalized as { hasPhoto?: boolean }).hasPhoto).toBe(true);
  });

  it("normalizes shipping and pre-checkout query ids", () => {
    const shipping = normalizeTelegramUpdate({
      update_id: 6000,
      shipping_query: {
        id: "ship_1",
        from: { id: 222, username: "alice" },
        invoice_payload: "payload"
      }
    });

    expect(shipping.trigger).toBe("shipping_query_received");
    expect((shipping as { shippingQueryId?: string }).shippingQueryId).toBe("ship_1");

    const preCheckout = normalizeTelegramUpdate({
      update_id: 6001,
      pre_checkout_query: {
        id: "pre_1",
        from: { id: 222, username: "alice" },
        currency: "USD",
        total_amount: 100,
        invoice_payload: "payload"
      }
    });

    expect(preCheckout.trigger).toBe("pre_checkout_query_received");
    expect((preCheckout as { preCheckoutQueryId?: string }).preCheckoutQueryId).toBe("pre_1");
  });

  it("returns null for unsupported updates", () => {
    const normalized = normalizeTelegramUpdate({ update_id: 1 });
    expect(normalized.trigger).toBe("update_received");
  });
});
