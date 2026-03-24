import { describe, expect, it } from "vitest";
import { actionSchema } from "@telegram-builder/shared";

describe("actionSchema", () => {
  it("accepts a valid send_text payload", () => {
    const parsed = actionSchema.parse({
      type: "send_text",
      text: "Hello from bot"
    });

    expect(parsed.type).toBe("send_text");
  });

  it("keeps backward compatibility for send_message alias", () => {
    const parsed = actionSchema.parse({
      type: "send_message",
      text: "Legacy"
    });

    expect(parsed.type).toBe("send_text");
  });

  it("rejects an empty text payload", () => {
    const result = actionSchema.safeParse({
      type: "send_text",
      text: ""
    });

    expect(result.success).toBe(false);
  });
});
