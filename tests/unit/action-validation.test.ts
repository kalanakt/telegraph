import { describe, expect, it } from "vitest";
import { actionSchema } from "@telegram-builder/shared";

describe("actionSchema v2", () => {
  it("accepts a valid telegram.sendMessage payload", () => {
    const parsed = actionSchema.parse({
      type: "telegram.sendMessage",
      params: {
        chat_id: "123",
        text: "Hello from bot",
        parse_mode: "HTML"
      }
    });

    expect(parsed.type).toBe("telegram.sendMessage");
  });

  it("supports rich fields like entities and inline keyboard", () => {
    const parsed = actionSchema.parse({
      type: "telegram.sendMessage",
      params: {
        chat_id: "123",
        text: "Hello",
        entities: [{ type: "bold", offset: 0, length: 5 }],
        reply_markup: {
          inline_keyboard: [[{ text: "Open", url: "https://example.com" }]]
        }
      }
    });

    expect(parsed.params.reply_markup).toBeDefined();
  });

  it("rejects invalid payloads", () => {
    const result = actionSchema.safeParse({
      type: "telegram.sendMessage",
      params: {
        text: "missing chat id"
      }
    });

    expect(result.success).toBe(false);
  });

  it("accepts query and join-request actions with template ids", () => {
    expect(
      actionSchema.safeParse({
        type: "telegram.answerPreCheckoutQuery",
        params: { pre_checkout_query_id: "{{event.preCheckoutQueryId}}", ok: true }
      }).success
    ).toBe(true);

    expect(
      actionSchema.safeParse({
        type: "telegram.answerShippingQuery",
        params: {
          shipping_query_id: "{{event.shippingQueryId}}",
          ok: true,
          shipping_options: [
            { id: "standard", title: "Standard", prices: [{ label: "Shipping", amount: 0 }] }
          ]
        }
      }).success
    ).toBe(true);

    expect(
      actionSchema.safeParse({
        type: "telegram.approveChatJoinRequest",
        params: { chat_id: "{{event.chatId}}", user_id: "{{event.fromUserId}}" }
      }).success
    ).toBe(true);
  });

  it("accepts the full sendChatAction set used by the builder", () => {
    expect(
      actionSchema.safeParse({
        type: "telegram.sendChatAction",
        params: { chat_id: "{{event.chatId}}", action: "typing" }
      }).success
    ).toBe(true);

    expect(
      actionSchema.safeParse({
        type: "telegram.sendChatAction",
        params: { chat_id: "{{event.chatId}}", action: "record_video_note" }
      }).success
    ).toBe(true);

    expect(
      actionSchema.safeParse({
        type: "telegram.sendChatAction",
        params: { chat_id: "{{event.chatId}}", action: "upload_video_note" }
      }).success
    ).toBe(true);
  });
});
