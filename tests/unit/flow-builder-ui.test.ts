import { describe, expect, it } from "vitest";
import { TELEGRAM_TRIGGER_TYPES, actionSchema, flowDefinitionSchema } from "@telegram-builder/shared";
import {
  coerceFlowDefinition,
  createActionTemplate,
  getTriggerGroups,
  migrateLegacyActionData
} from "@/lib/flow-builder";

describe("flow-builder trigger groups", () => {
  it("covers all trigger types from shared capabilities", () => {
    const grouped = getTriggerGroups();
    const fromGroups = new Set(grouped.flatMap((group) => group.triggers));

    for (const trigger of TELEGRAM_TRIGGER_TYPES) {
      expect(fromGroups.has(trigger)).toBe(true);
    }
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

  it("serializes sendPhoto and sendDocument with captions and reply keyboard", () => {
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
    expect(actionSchema.safeParse(sendDocumentPayload).success).toBe(true);
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
