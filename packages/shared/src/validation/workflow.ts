import { z } from "zod";
import { isActionAllowedForTrigger, normalizeActionPayload } from "../domain/actions";
import type { ActionPayload, ConditionPayload } from "../types/workflow";

const MAX_DELAY_MS = 60_000;
const TEMPLATE_FIELD_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const ALLOWED_TEMPLATE_FIELDS = new Set([
  "event.text",
  "event.chatId",
  "event.chatType",
  "event.fromUserId",
  "event.messageId",
  "event.callbackData",
  "event.command",
  "event.commandArgs",
  "event.inlineQuery",
  "vars"
]);

export const triggerSchema = z.enum([
  "message_received",
  "message_edited",
  "command_received",
  "callback_query_received",
  "inline_query_received",
  "chat_member_updated"
]);

export const conditionSchema: z.ZodType<ConditionPayload> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("text_contains"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("from_user_id"), value: z.number().int() }),
    z.object({ type: z.literal("from_username_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("chat_id_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("chat_type_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("message_source_equals"), value: z.enum(["user", "channel", "group"]) }),
    z.object({ type: z.literal("variable_equals"), key: z.string().min(1), value: z.string() }),
    z.object({ type: z.literal("variable_exists"), key: z.string().min(1) }),
    z.object({ type: z.literal("all"), conditions: z.array(conditionSchema).min(1) }),
    z.object({ type: z.literal("any"), conditions: z.array(conditionSchema).min(1) })
  ])
);

const sendTextActionSchema = z.object({
  type: z.literal("send_text"),
  chatId: z.string().optional(),
  text: z.string().min(1).max(4000)
});

const legacySendMessageActionSchema = z.object({
  type: z.literal("send_message"),
  chatId: z.string().optional(),
  text: z.string().min(1).max(4000)
});

const sendPhotoActionSchema = z.object({
  type: z.literal("send_photo"),
  chatId: z.string().optional(),
  photoUrl: z.string().url(),
  caption: z.string().max(1024).optional()
});

const sendDocumentActionSchema = z.object({
  type: z.literal("send_document"),
  chatId: z.string().optional(),
  documentUrl: z.string().url(),
  caption: z.string().max(1024).optional()
});

const editMessageTextActionSchema = z.object({
  type: z.literal("edit_message_text"),
  chatId: z.string().optional(),
  messageId: z.number().int().positive().optional(),
  text: z.string().min(1).max(4000)
});

const deleteMessageActionSchema = z.object({
  type: z.literal("delete_message"),
  chatId: z.string().optional(),
  messageId: z.number().int().positive().optional()
});

const answerCallbackActionSchema = z.object({
  type: z.literal("answer_callback_query"),
  callbackQueryId: z.string().optional(),
  text: z.string().max(200).optional(),
  showAlert: z.boolean().optional()
});

const delayActionSchema = z.object({
  type: z.literal("delay"),
  delayMs: z.number().int().min(0).max(MAX_DELAY_MS)
});

const setVariableActionSchema = z.object({
  type: z.literal("set_variable"),
  key: z.string().min(1).max(80),
  value: z.string().max(4000)
});

const branchOnVariableActionSchema = z.object({
  type: z.literal("branch_on_variable"),
  key: z.string().min(1).max(80),
  equals: z.string().max(4000)
});

const restrictChatMemberActionSchema = z.object({
  type: z.literal("restrict_chat_member"),
  chatId: z.string().optional(),
  userId: z.number().int(),
  untilDate: z.number().int().positive().optional(),
  canSendMessages: z.boolean().optional()
});

const banChatMemberActionSchema = z.object({
  type: z.literal("ban_chat_member"),
  chatId: z.string().optional(),
  userId: z.number().int(),
  revokeMessages: z.boolean().optional()
});

const unbanChatMemberActionSchema = z.object({
  type: z.literal("unban_chat_member"),
  chatId: z.string().optional(),
  userId: z.number().int(),
  onlyIfBanned: z.boolean().optional()
});

export const actionSchema = z
  .discriminatedUnion("type", [
    sendTextActionSchema,
    legacySendMessageActionSchema,
    sendPhotoActionSchema,
    sendDocumentActionSchema,
    editMessageTextActionSchema,
    deleteMessageActionSchema,
    answerCallbackActionSchema,
    delayActionSchema,
    setVariableActionSchema,
    branchOnVariableActionSchema,
    restrictChatMemberActionSchema,
    banChatMemberActionSchema,
    unbanChatMemberActionSchema
  ])
  .transform((action) => normalizeActionPayload(action) as ActionPayload);

const flowNodeBaseSchema = z.object({
  id: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number()
  })
});

const startNodeSchema = flowNodeBaseSchema.extend({
  type: z.literal("start"),
  data: z.record(z.string(), z.unknown()).default({})
});

const conditionNodeSchema = flowNodeBaseSchema.extend({
  type: z.literal("condition"),
  data: conditionSchema
});

const actionNodeSchema = flowNodeBaseSchema.extend({
  type: z.literal("action"),
  data: actionSchema
});

export const flowNodeSchema = z.discriminatedUnion("type", [startNodeSchema, conditionNodeSchema, actionNodeSchema]);

export const flowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional()
});

function validateTemplates(action: ActionPayload, ctx: z.RefinementCtx, nodeId: string) {
  const values: string[] = [];
  switch (action.type) {
    case "send_text":
      values.push(action.text);
      break;
    case "send_photo":
    case "send_document":
      if (action.caption) {
        values.push(action.caption);
      }
      break;
    case "edit_message_text":
      values.push(action.text);
      break;
    case "set_variable":
      values.push(action.value);
      break;
    case "branch_on_variable":
      values.push(action.equals);
      break;
    case "answer_callback_query":
      if (action.text) {
        values.push(action.text);
      }
      break;
    default:
      break;
  }

  for (const value of values) {
    for (const match of value.matchAll(TEMPLATE_FIELD_REGEX)) {
      const token = match[1] ?? "";
      const isVariableRef = token.startsWith("vars.");
      const isAllowed = isVariableRef || ALLOWED_TEMPLATE_FIELDS.has(token);
      if (!isAllowed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Node ${nodeId} references unknown template field: ${token}`
        });
      }
    }
  }
}

export const flowDefinitionSchema = z
  .object({
    nodes: z.array(flowNodeSchema).min(1),
    edges: z.array(flowEdgeSchema)
  })
  .superRefine((flow, ctx) => {
    const nodeMap = new Map(flow.nodes.map((node) => [node.id, node]));
    const starts = flow.nodes.filter((node) => node.type === "start");

    if (starts.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flow must include exactly one start node."
      });
    }

    const seenNodeIds = new Set<string>();
    for (const node of flow.nodes) {
      if (seenNodeIds.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate node id: ${node.id}`
        });
      }
      seenNodeIds.add(node.id);
    }

    const seenEdgeIds = new Set<string>();
    for (const edge of flow.edges) {
      if (seenEdgeIds.has(edge.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate edge id: ${edge.id}`
        });
      }
      seenEdgeIds.add(edge.id);

      if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge ${edge.id} has dangling source/target node.`
        });
      }
    }

    for (const node of flow.nodes) {
      if (node.type !== "condition") {
        continue;
      }
      const outgoing = flow.edges.filter((edge) => edge.source === node.id);
      const trueEdgeCount = outgoing.filter((edge) => edge.sourceHandle === "true").length;
      const falseEdgeCount = outgoing.filter((edge) => edge.sourceHandle === "false").length;
      if (trueEdgeCount !== 1 || falseEdgeCount > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Condition node ${node.id} must have exactly one 'true' edge and at most one 'false' edge.`
        });
      }
    }

    const inDegree = new Map<string, number>(flow.nodes.map((node) => [node.id, 0]));
    const adjacency = new Map<string, string[]>(flow.nodes.map((node) => [node.id, []]));

    for (const edge of flow.edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      const neighbors = adjacency.get(edge.source);
      if (neighbors) {
        neighbors.push(edge.target);
      }
    }

    const queue = [...inDegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id);
    let visitedCount = 0;
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId) {
        continue;
      }

      visitedCount += 1;
      const neighbors = adjacency.get(nodeId) ?? [];
      for (const neighborId of neighbors) {
        const next = (inDegree.get(neighborId) ?? 0) - 1;
        inDegree.set(neighborId, next);
        if (next === 0) {
          queue.push(neighborId);
        }
      }
    }

    if (visitedCount !== flow.nodes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flow graph must be acyclic."
      });
    }
  });

export const createFlowSchema = z
  .object({
    botId: z.string().min(1),
    name: z.string().min(1).max(120),
    trigger: triggerSchema,
    flowDefinition: flowDefinitionSchema
  })
  .superRefine((flow, ctx) => {
    for (const node of flow.flowDefinition.nodes) {
      if (node.type !== "action") {
        continue;
      }

      const action = node.data;
      if (!isActionAllowedForTrigger(action.type, flow.trigger)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Action ${action.type} is not allowed for trigger ${flow.trigger}.`
        });
      }

      validateTemplates(action, ctx, node.id);
    }
  });

export const addBotSchema = z.object({
  token: z.string().min(10)
});
