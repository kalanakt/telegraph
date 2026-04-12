import { describe, expect, it } from "vitest";
import { TELEGRAM_TRIGGER_TYPES, actionSchema, flowDefinitionSchema } from "@telegram-builder/shared";
import {
  coerceFlowDefinition,
  createActionTemplate,
  getBuilderCatalog,
  getTriggerGroups,
  migrateLegacyActionData
} from "@/lib/flow-builder";
import {
  buildCallbackToken,
  canCreateConnection,
  createBuilderEdge,
  createFlowNode,
  findLinkedCallbackFlows,
  getBranchHandleForInsertedNode,
  setInlineButtonCallbackToken,
} from "@/components/flow-builder/utils";

describe("flow-builder trigger groups", () => {
  it("covers all trigger types from shared capabilities", () => {
    const grouped = getTriggerGroups();
    const fromGroups = new Set(grouped.flatMap((group) => group.triggers));

    for (const trigger of TELEGRAM_TRIGGER_TYPES) {
      expect(fromGroups.has(trigger)).toBe(true);
    }
  });

  it("builds a task-first builder catalog", () => {
    const sections = getBuilderCatalog("message_received", false);
    const titles = new Set(sections.map((section) => section.title));

    expect(titles.has("Conversations")).toBe(true);
    expect(titles.has("Filters")).toBe(true);
    expect(titles.has("Send & Reply")).toBe(true);
    expect(
      sections.some((section) =>
        section.items.some((item) => item.actionType === "telegram.sendMessage" && item.group === "Send & Reply"),
      ),
    ).toBe(true);
  });
});

describe("flow-builder action migration", () => {
  it("migrates legacy send_photo to canonical telegram.sendPhoto", () => {
    const migrated = migrateLegacyActionData({
      type: "send_photo",
      chatId: "123",
      photoUrl: "https://example.com/photo.jpg",
      caption: "Preview"
    });

    expect(migrated).toEqual({
      type: "telegram.sendPhoto",
      params: {
        chat_id: "123",
        photo: "https://example.com/photo.jpg",
        caption: "Preview"
      }
    });
  });

  it("passes through canonical actions unchanged", () => {
    const payload = {
      type: "telegram.sendMessage",
      params: { chat_id: "123", text: "Hello" }
    } as const;

    const migrated = migrateLegacyActionData(payload);
    expect(migrated).toEqual(payload);
  });
});

describe("flow-builder composer payloads", () => {
  it("serializes sendMessage with inline buttons", () => {
    const payload = {
      ...createActionTemplate("telegram.sendMessage"),
      params: {
        chat_id: "123",
        text: "Choose",
        reply_markup: {
          inline_keyboard: [[{ text: "Open", url: "https://example.com" }]]
        }
      }
    };

    const parsed = actionSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("serializes sendPhoto, sendVideo, and sendDocument with captions and reply keyboard", () => {
    const sendPhotoPayload = {
      ...createActionTemplate("telegram.sendPhoto"),
      params: {
        chat_id: "123",
        photo: "https://example.com/photo.jpg",
        caption: "Photo",
        reply_markup: {
          keyboard: [[{ text: "Next" }]],
          resize_keyboard: true
        }
      }
    };

    const sendVideoPayload = {
      ...createActionTemplate("telegram.sendVideo"),
      params: {
        chat_id: "123",
        video: "https://example.com/video.mp4",
        caption: "Video",
        reply_markup: {
          keyboard: [[{ text: "Watch" }]],
          resize_keyboard: true
        }
      }
    };

    const sendDocumentPayload = {
      ...createActionTemplate("telegram.sendDocument"),
      params: {
        chat_id: "123",
        document: "https://example.com/file.pdf",
        caption: "Document",
        reply_markup: {
          keyboard: [[{ text: "Done" }]],
          resize_keyboard: true
        }
      }
    };

    expect(actionSchema.safeParse(sendPhotoPayload).success).toBe(true);
    expect(actionSchema.safeParse(sendVideoPayload).success).toBe(true);
    expect(actionSchema.safeParse(sendDocumentPayload).success).toBe(true);
  });

  it("serializes query and join-request templates", () => {
    expect(actionSchema.safeParse(createActionTemplate("telegram.answerInlineQuery")).success).toBe(true);
    expect(actionSchema.safeParse(createActionTemplate("telegram.answerShippingQuery")).success).toBe(true);
    expect(actionSchema.safeParse(createActionTemplate("telegram.answerPreCheckoutQuery")).success).toBe(true);
    expect(actionSchema.safeParse(createActionTemplate("telegram.approveChatJoinRequest")).success).toBe(true);
    expect(actionSchema.safeParse(createActionTemplate("telegram.declineChatJoinRequest")).success).toBe(true);
  });

  it("builds a valid default template for chat actions", () => {
    const payload = createActionTemplate("telegram.sendChatAction");

    expect(payload).toEqual({
      type: "telegram.sendChatAction",
      params: {
        chat_id: "{{event.chatId}}",
        action: "typing"
      }
    });
    expect(actionSchema.safeParse(payload).success).toBe(true);
  });
});

describe("flow-builder legacy flow coercion", () => {
  it("coerces legacy action nodes into a valid flow definition", () => {
    const flow = coerceFlowDefinition({
      nodes: [
        { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "action_1",
          type: "action",
          position: { x: 220, y: 0 },
          data: { type: "send_text", chatId: "123", text: "Hi" }
        }
      ],
      edges: [{ id: "e1", source: "start", target: "action_1" }]
    });

    expect(flow).not.toBeNull();
    const parsed = flowDefinitionSchema.safeParse(flow);
    expect(parsed.success).toBe(true);
    expect(parsed.data.nodes[1]).toMatchObject({
      type: "action",
      data: {
        type: "telegram.sendMessage"
      }
    });
  });
});

describe("flow-builder toolbar node creation", () => {
  it("creates a single start node template and places later nodes on the grid", () => {
    const start = createFlowNode("start", []);
    const condition = createFlowNode("condition", [start], { x: 173, y: 219 });
    const action = createFlowNode("action", [start, condition], { x: 173, y: 219 });

    expect(start.type).toBe("start");
    expect(condition.type).toBe("condition");
    expect(action.type).toBe("action");
    expect(condition.position).toEqual({ x: 220, y: 220 });
    expect(action.position).toEqual({ x: 260, y: 340 });
  });

  it("prevents duplicate condition branch connections while allowing explicit normal edges", () => {
    const nodes = [
      { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
      { id: "condition_1", type: "condition", position: { x: 200, y: 0 }, data: { type: "text_contains", value: "x" } },
      { id: "action_1", type: "action", position: { x: 400, y: 0 }, data: createActionTemplate("telegram.sendMessage") },
      { id: "action_2", type: "action", position: { x: 400, y: 120 }, data: createActionTemplate("telegram.sendMessage") },
    ];

    const edges = [
      { id: "e1", source: "condition_1", target: "action_1", sourceHandle: "true" },
    ];

    expect(
      canCreateConnection(
        { source: "condition_1", target: "action_2", sourceHandle: "true" },
        nodes,
        edges,
      ),
    ).toBe(false);

    expect(
      canCreateConnection(
        { source: "start_1", target: "condition_1" },
        nodes,
        edges,
      ),
    ).toBe(true);
  });

  it("creates smooth-step builder edges with branch labels", () => {
    const edge = createBuilderEdge({
      source: "condition_1",
      sourceHandle: "true",
      target: "action_1",
      targetHandle: null,
    });

    expect(edge.type).toBe("builder-edge");
    expect(edge.label).toBe("true");
  });

  it("uses a deterministic callback token and links matching callback flows", () => {
    const token = buildCallbackToken({
      ruleId: "rule_1",
      nodeId: "action_1",
      rowIndex: 0,
      buttonIndex: 0,
      buttonLabel: "Open settings",
    });

    const params = setInlineButtonCallbackToken(
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Open settings" }]],
        },
      },
      0,
      0,
      token,
    );

    const linked = findLinkedCallbackFlows(
      [
        {
          id: "callback_rule",
          botId: "bot_1",
          name: "Settings callback",
          trigger: "callback_query_received",
          flowDefinition: {
            nodes: [
              { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
              {
                id: "condition_1",
                type: "condition",
                position: { x: 220, y: 0 },
                data: { type: "callback_data_equals", value: token },
              },
            ],
            edges: [{ id: "e1", source: "start_1", target: "condition_1" }],
          },
        },
      ],
      params,
      0,
      0,
    );

    expect(token).toContain("open_settings");
    expect(linked[0]?.ruleId).toBe("callback_rule");
  });

  it("chooses the safe default branch when inserting nodes onto edges", () => {
    expect(getBranchHandleForInsertedNode("condition")).toBe("true");
    expect(getBranchHandleForInsertedNode("switch")).toBe("default");
    expect(getBranchHandleForInsertedNode("action")).toBeUndefined();
  });
});
