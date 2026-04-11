import { describe, expect, it } from "vitest";
import { evaluateAllConditions } from "@telegram-builder/shared";
import type { NormalizedEvent } from "@telegram-builder/shared";

const event: NormalizedEvent = {
  source: "telegram",
  eventId: "evt_1",
  trigger: "message_received",
  updateId: 1,
  chatId: "1001",
  chatType: "private",
  fromUsername: "alice",
  messageSource: "user",
  fromUserId: 5566,
  text: "Hello World",
  variables: {}
};

describe("evaluateAllConditions", () => {
  it("passes when all conditions match", () => {
    const ok = evaluateAllConditions(event, [
      { type: "text_contains", value: "hello" },
      { type: "text_equals", value: "hello world" },
      { type: "text_starts_with", value: "hello" },
      { type: "text_ends_with", value: "world" },
      { type: "from_user_id", value: 5566 }
    ]);

    expect(ok).toBe(true);
  });

  it("fails when one condition does not match", () => {
    const ok = evaluateAllConditions(event, [
      { type: "text_contains", value: "hello" },
      { type: "from_user_id", value: 9999 }
    ]);

    expect(ok).toBe(false);
  });

  it("supports username/chat/source and OR conditions", () => {
    const ok = evaluateAllConditions(event, [
      { type: "from_username_equals", value: "alice" },
      { type: "chat_id_equals", value: "1001" },
      { type: "message_source_equals", value: "user" },
      {
        type: "any",
        conditions: [
          { type: "from_user_id", value: 1 },
          { type: "from_user_id", value: 5566 }
        ]
      }
    ]);

    expect(ok).toBe(true);
  });

  it("supports message feature and command/callback/status conditions", () => {
    const ok = evaluateAllConditions(
      {
        ...event,
        trigger: "command_received",
        command: "/start",
        commandArgs: "abc",
        callbackData: "confirm_yes",
        targetUserId: 99,
        oldStatus: "left",
        newStatus: "member",
        hasPhoto: true
      },
      [
        { type: "command_equals", value: "/start" },
        { type: "command_args_contains", value: "a" },
        { type: "callback_data_contains", value: "yes" },
        { type: "target_user_id_equals", value: 99 },
        { type: "old_status_equals", value: "left" },
        { type: "new_status_equals", value: "member" },
        { type: "message_has_photo" }
      ]
    );

    expect(ok).toBe(true);
  });

  it("supports shared event path conditions", () => {
    const ok = evaluateAllConditions(
      {
        ...event,
        joinRequestBio: "crypto promo account",
        currency: "USD",
        reactionCount: [{ type: "emoji", total_count: 3 }],
      },
      [
        { type: "event_path_exists", key: "joinRequestBio" },
        { type: "event_path_contains", key: "joinRequestBio", value: "promo" },
        { type: "event_path_equals", key: "currency", value: "usd" },
        { type: "event_path_matches_regex", key: "joinRequestBio", value: "crypto\\s+promo" },
      ]
    );

    expect(ok).toBe(true);
  });
});
