import { describe, expect, it } from "vitest";
import { buildIdempotencyKey } from "@telegram-builder/shared";

describe("buildIdempotencyKey", () => {
  it("creates deterministic key from bot and update ids", () => {
    expect(buildIdempotencyKey("bot_abc", 42)).toBe("bot_abc:42");
  });
});
