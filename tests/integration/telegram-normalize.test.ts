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

  it("normalizes shipping and pre-checkout query payloads", () => {
    const shipping = normalizeTelegramUpdate({
      update_id: 6000,
      shipping_query: {
        id: "ship_1",
        from: { id: 222, username: "alice" },
        invoice_payload: "payload",
        shipping_address: {
          country_code: "US",
          city: "Colombo",
        }
      }
    });

    expect(shipping.trigger).toBe("shipping_query_received");
    expect((shipping as { shippingQueryId?: string }).shippingQueryId).toBe("ship_1");
    expect((shipping as { invoicePayload?: string }).invoicePayload).toBe("payload");
    expect((shipping as { shippingAddress?: { city?: string } }).shippingAddress?.city).toBe("Colombo");

    const preCheckout = normalizeTelegramUpdate({
      update_id: 6001,
      pre_checkout_query: {
        id: "pre_1",
        from: { id: 222, username: "alice" },
        currency: "USD",
        total_amount: 100,
        invoice_payload: "payload",
        shipping_option_id: "standard",
        order_info: { email: "alice@example.org" }
      }
    });

    expect(preCheckout.trigger).toBe("pre_checkout_query_received");
    expect((preCheckout as { preCheckoutQueryId?: string }).preCheckoutQueryId).toBe("pre_1");
    expect((preCheckout as { currency?: string }).currency).toBe("USD");
    expect((preCheckout as { totalAmount?: number }).totalAmount).toBe(100);
    expect((preCheckout as { shippingOptionId?: string }).shippingOptionId).toBe("standard");
  });

  it("normalizes join request, poll answer, and reaction payload details", () => {
    const joinRequest = normalizeTelegramUpdate({
      update_id: 7000,
      chat_join_request: {
        chat: { id: 900, type: "supergroup" },
        from: { id: 111, username: "builder" },
        user_chat_id: 123,
        date: 1,
        bio: "crypto promo account",
        invite_link: { invite_link: "https://t.me/+abc", name: "VIP" }
      }
    });

    expect(joinRequest.trigger).toBe("chat_join_request_received");
    expect((joinRequest as { joinRequestBio?: string }).joinRequestBio).toContain("promo");
    expect((joinRequest as { joinRequestInviteLink?: string }).joinRequestInviteLink).toBe("VIP");

    const pollAnswer = normalizeTelegramUpdate({
      update_id: 7001,
      poll_answer: {
        poll_id: "poll_1",
        user: { id: 222, username: "alice" },
        option_ids: [1, 3]
      }
    });

    expect(pollAnswer.trigger).toBe("poll_answer_received");
    expect((pollAnswer as { pollId?: string }).pollId).toBe("poll_1");
    expect((pollAnswer as { pollOptionIds?: number[] }).pollOptionIds).toEqual([1, 3]);

    const reaction = normalizeTelegramUpdate({
      update_id: 7002,
      message_reaction: {
        chat: { id: 321, type: "supergroup" },
        message_id: 10,
        date: 1,
        user: { id: 444, username: "bob" },
        old_reaction: [{ type: "emoji", emoji: "👍" }],
        new_reaction: [{ type: "emoji", emoji: "🔥" }]
      }
    });

    expect(reaction.trigger).toBe("message_reaction_updated");
    expect((reaction as { oldReaction?: unknown[] }).oldReaction).toEqual([{ type: "emoji", emoji: "👍" }]);
    expect((reaction as { newReaction?: unknown[] }).newReaction).toEqual([{ type: "emoji", emoji: "🔥" }]);

    const reactionCount = normalizeTelegramUpdate({
      update_id: 7003,
      message_reaction_count: {
        chat: { id: 321, type: "supergroup" },
        message_id: 11,
        date: 1,
        reactions: [{ type: "emoji", total_count: 4, emoji: "🔥" }]
      }
    });

    expect(reactionCount.trigger).toBe("message_reaction_count_updated");
    expect((reactionCount as { reactionCount?: unknown[] }).reactionCount).toEqual([
      { type: "emoji", total_count: 4, emoji: "🔥" }
    ]);
  });

  it("returns null for unsupported updates", () => {
    const normalized = normalizeTelegramUpdate({ update_id: 1 });
    expect(normalized.trigger).toBe("update_received");
  });
});
