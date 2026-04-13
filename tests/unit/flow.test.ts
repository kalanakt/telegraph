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
        {
          id: "a",
          type: "action",
          position: { x: 0, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "ok" } }
        }
      ],
      edges: [
        { id: "e1", source: "s", target: "a" },
        { id: "e2", source: "a", target: "s" }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects disconnected nodes that are not reachable from the start", () => {
    const result = flowDefinitionSchema.safeParse({
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "action_connected",
          type: "action",
          position: { x: 200, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "ok" } }
        },
        {
          id: "action_disconnected",
          type: "action",
          position: { x: 200, y: 140 },
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "dangling" } }
        }
      ],
      edges: [{ id: "e1", source: "start", target: "action_connected" }]
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("not reachable from the start node"))).toBe(true);
  });

  it("accepts a fully connected graph", () => {
    const result = flowDefinitionSchema.safeParse({
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "condition",
          type: "condition",
          position: { x: 200, y: 0 },
          data: { type: "text_contains", value: "hello" }
        },
        {
          id: "action_true",
          type: "action",
          position: { x: 400, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "yes" } }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "condition" },
        { id: "e2", source: "condition", target: "action_true", sourceHandle: "true" }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("accepts switch, set_variable, and delay nodes in a connected graph", () => {
    const result = flowDefinitionSchema.safeParse({
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {}, meta: { key: "start_node", label: "Start" } },
        {
          id: "switch_1",
          type: "switch",
          position: { x: 200, y: 0 },
          meta: { key: "route_kind", label: "Route kind" },
          data: {
            path: "event.text",
            cases: [{ id: "hello", value: "hello from user", label: "Hello" }]
          }
        },
        {
          id: "set_1",
          type: "set_variable",
          position: { x: 400, y: 0 },
          meta: { key: "set_customer", label: "Set customer" },
          data: { path: "customer.name", value: "{{event.text}}" }
        },
        {
          id: "delay_1",
          type: "delay",
          position: { x: 600, y: 0 },
          meta: { key: "delay_reply", label: "Delay reply" },
          data: { delay_ms: 1500 }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "switch_1" },
        { id: "e2", source: "switch_1", target: "set_1", sourceHandle: "hello" },
        { id: "e3", source: "switch_1", target: "delay_1", sourceHandle: "default" },
        { id: "e4", source: "set_1", target: "delay_1" }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("accepts delays up to 120 days and rejects anything longer", () => {
    const valid = flowDefinitionSchema.safeParse({
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "delay_120d",
          type: "delay",
          position: { x: 200, y: 0 },
          data: { delay_ms: 120 * 24 * 60 * 60 * 1000 }
        }
      ],
      edges: [{ id: "e1", source: "start", target: "delay_120d" }]
    });

    const invalid = flowDefinitionSchema.safeParse({
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "delay_121d",
          type: "delay",
          position: { x: 200, y: 0 },
          data: { delay_ms: 121 * 24 * 60 * 60 * 1000 }
        }
      ],
      edges: [{ id: "e1", source: "start", target: "delay_121d" }]
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
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
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "matched" } }
        },
        {
          id: "a_false",
          type: "action",
          position: { x: 0, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "not matched" } }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "c1" },
        { id: "e2", source: "c1", target: "a_true", sourceHandle: "true" },
        { id: "e3", source: "c1", target: "a_false", sourceHandle: "false" }
      ]
    };

    const actions = deriveActionsFromFlow(flow, baseEvent);
    expect(actions).toEqual([
      { actionId: "a_true", payload: { type: "telegram.sendMessage", params: { chat_id: "123", text: "matched" } } }
    ]);
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
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "fallback" } }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "c1" },
        { id: "e2", source: "c1", target: "a_false", sourceHandle: "false" }
      ]
    };

    const actions = deriveActionsFromFlow(flow, baseEvent);
    expect(actions).toEqual([
      { actionId: "a_false", payload: { type: "telegram.sendMessage", params: { chat_id: "123", text: "fallback" } } }
    ]);
  });

  it("routes switch branches from event values", () => {
    const flow = {
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {}, meta: { key: "start_node", label: "Start" } },
        {
          id: "switch_1",
          type: "switch",
          position: { x: 0, y: 0 },
          meta: { key: "route_message", label: "Route message" },
          data: {
            path: "event.text",
            cases: [{ id: "hello", value: "hello from user", label: "Hello" }]
          }
        },
        {
          id: "a_true",
          type: "action",
          position: { x: 0, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "matched switch" } },
          meta: { key: "send_match", label: "Send match" }
        },
        {
          id: "a_default",
          type: "action",
          position: { x: 0, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "123", text: "default switch" } },
          meta: { key: "send_default", label: "Send default" }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "switch_1" },
        { id: "e2", source: "switch_1", target: "a_true", sourceHandle: "hello" },
        { id: "e3", source: "switch_1", target: "a_default", sourceHandle: "default" }
      ]
    };

    const actions = deriveActionsFromFlow(flow, baseEvent);
    expect(actions).toEqual([
      { actionId: "a_true", payload: { type: "telegram.sendMessage", params: { chat_id: "123", text: "matched switch" } } }
    ]);
  });

  it("returns internal executable nodes for set_variable and delay", () => {
    const flow = {
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {}, meta: { key: "start_node", label: "Start" } },
        {
          id: "set_1",
          type: "set_variable",
          position: { x: 200, y: 0 },
          meta: { key: "set_customer", label: "Set customer" },
          data: { path: "customer.name", value: "{{event.text}}" }
        },
        {
          id: "delay_1",
          type: "delay",
          position: { x: 400, y: 0 },
          meta: { key: "delay_reply", label: "Delay reply" },
          data: { delay_ms: 60000 }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "set_1" },
        { id: "e2", source: "set_1", target: "delay_1" }
      ]
    };

    const initial = deriveActionsFromFlow(flow, baseEvent);
    expect(initial).toEqual([
      {
        actionId: "set_1",
        payload: {
          type: "workflow.setVariable",
          params: {
            path: "customer.name",
            value: "{{event.text}}"
          }
        }
      }
    ]);
  });

  it("returns stateful commerce nodes as executable payloads", () => {
    const flow = {
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "await_1",
          type: "await_message",
          position: { x: 200, y: 0 },
          data: { timeout_ms: 60000, store_as: "customer_reply" }
        },
        {
          id: "invoice_1",
          type: "create_invoice",
          position: { x: 400, y: 0 },
          data: {
            invoice_payload: "order-{{event.updateId}}",
            currency: "USD",
            total_amount: 1500,
            title: "Starter order"
          }
        }
      ],
      edges: [
        { id: "e1", source: "start", target: "await_1" },
        { id: "e2", source: "await_1", target: "invoice_1" }
      ]
    };

    expect(deriveActionsFromFlow(flow, baseEvent)).toEqual([
      {
        actionId: "await_1",
        payload: {
          type: "workflow.awaitMessage",
          params: {
            timeout_ms: 60000,
            store_as: "customer_reply"
          }
        }
      }
    ]);
  });
});
