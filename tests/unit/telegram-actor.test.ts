import { describe, expect, it } from "vitest";
import { extractTelegramActor } from "@telegram-builder/shared";

describe("extractTelegramActor", () => {
  it("extracts message actors", () => {
    expect(
      extractTelegramActor({
        update_id: 1,
        message: {
          message_id: 10,
          chat: { id: 20, type: "private" },
          from: {
            id: 30,
            username: "alice",
            first_name: "Alice",
            language_code: "en"
          }
        }
      })
    ).toEqual({
      id: 30,
      username: "alice",
      first_name: "Alice",
      language_code: "en"
    });
  });

  it("extracts callback actors", () => {
    expect(
      extractTelegramActor({
        update_id: 2,
        callback_query: {
          id: "cb_1",
          from: {
            id: 40,
            username: "bob"
          }
        }
      })
    ).toEqual({
      id: 40,
      username: "bob"
    });
  });

  it("ignores bot actors", () => {
    expect(
      extractTelegramActor({
        update_id: 3,
        message: {
          message_id: 10,
          chat: { id: 20, type: "private" },
          from: {
            id: 50,
            is_bot: true
          }
        }
      })
    ).toBeNull();
  });
});
