import { describe, expect, it } from "vitest";
import { workflowTemplateDraftSchema } from "@telegram-builder/shared";

function startOnlyFlow() {
  return {
    nodes: [
      {
        id: "start_1",
        type: "start" as const,
        position: { x: 0, y: 0 },
        data: {}
      }
    ],
    edges: []
  };
}

function callbackActionFlow() {
  return {
    nodes: [
      {
        id: "start_1",
        type: "start" as const,
        position: { x: 0, y: 0 },
        data: {}
      },
      {
        id: "action_1",
        type: "action" as const,
        position: { x: 220, y: 0 },
        data: {
          type: "telegram.answerCallbackQuery",
          params: {
            callback_query_id: "{{event.callbackQueryId}}",
            text: "Done"
          }
        }
      }
    ],
    edges: [{ id: "edge_1", source: "start_1", target: "action_1" }]
  };
}

describe("workflowTemplateDraftSchema", () => {
  it("accepts a template bundle with multiple valid flows", () => {
    const parsed = workflowTemplateDraftSchema.safeParse({
      title: "Support bundle",
      description: "Useful bot flows",
      visibility: "PRIVATE",
      flows: [
        {
          name: "Welcome flow",
          trigger: "message_received",
          flowDefinition: startOnlyFlow()
        },
        {
          name: "Callbacks",
          trigger: "callback_query_received",
          flowDefinition: callbackActionFlow()
        }
      ]
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects actions that do not match the selected trigger", () => {
    const parsed = workflowTemplateDraftSchema.safeParse({
      title: "Broken bundle",
      description: "",
      visibility: "PUBLIC",
      flows: [
        {
          name: "Invalid action",
          trigger: "message_received",
          flowDefinition: callbackActionFlow()
        }
      ]
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error.issues[0]?.message).toContain("not allowed for trigger");
  });
});
