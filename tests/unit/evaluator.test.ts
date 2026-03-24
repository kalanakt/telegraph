import { describe, expect, it } from "vitest";
import { evaluateAllConditions } from "@telegram-builder/shared";
import type { NormalizedEvent } from "@telegram-builder/shared";

const event: NormalizedEvent = {
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
});
