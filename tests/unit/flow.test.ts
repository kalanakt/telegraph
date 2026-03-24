import { describe, expect, it } from "vitest";
import { deriveActionsFromFlow, flowDefinitionSchema } from "@telegram-builder/shared";

const baseEvent = {
  trigger: "message_received" as const,
  updateId: 1,
  chatId: "123",
  chatType: "private",
  messageSource: "user" as const,
  text: "hello from user",
  fromUserId: 42,
  variables: {}
};

describe("flowDefinitionSchema", () => {
  it("rejects multiple start nodes", () => {
    const result = flowDefinitionSchema.safeParse({
      nodes: [
        { id: "s1", type: "start", position: { x: 0, y: 0 }, data: {} },
        { id: "s2", type: "start", position: { x: 10, y: 10 }, data: {} }
      ],
      edges: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects cycles", () => {
    const result = flowDefinitionSchema.safeParse({
      nodes: [
        { id: "s", type: "start", position: { x: 0, y: 0 }, data: {} },
        { id: "a", type: "action", position: { x: 0, y: 0 }, data: { type: "send_text", text: "ok" } }
      ],
      edges: [
        { id: "e1", source: "s", target: "a" },
        { id: "e2", source: "a", target: "s" }
      ]
    });

    expect(result.success).toBe(false);
  });
});

describe("deriveActionsFromFlow", () => {
  it("takes true branch when condition matches", () => {
    const flow = {
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "c1",
          type: "condition",
          position: { x: 0, y: 0 },
          data: { type: "text_contains", value: "hello" }
        },
        {
          id: "a_true",
          type: "action",
          position: { x: 0, y: 0 },
          data: { type: "send_text", text: "matched" }
        },
        {
          id: "a_false",
          type: "action",
          position: { x: 0, y: 0 },
          data: { type: "send_text", text: "not matched" }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "c1" },
        { id: "e2", source: "c1", target: "a_true", sourceHandle: "true" },
        { id: "e3", source: "c1", target: "a_false", sourceHandle: "false" }
      ]
    };

    const actions = deriveActionsFromFlow(flow, baseEvent);
    expect(actions).toEqual([{ actionId: "a_true", payload: { type: "send_text", text: "matched" } }]);
  });

  it("takes false branch when condition does not match", () => {
    const flow = {
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "c1",
          type: "condition",
          position: { x: 0, y: 0 },
          data: { type: "text_equals", value: "bye" }
        },
        {
          id: "a_false",
          type: "action",
          position: { x: 0, y: 0 },
          data: { type: "send_text", text: "fallback" }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "c1" },
        { id: "e2", source: "c1", target: "a_false", sourceHandle: "false" }
      ]
    };

    const actions = deriveActionsFromFlow(flow, baseEvent);
    expect(actions).toEqual([{ actionId: "a_false", payload: { type: "send_text", text: "fallback" } }]);
  });
});
