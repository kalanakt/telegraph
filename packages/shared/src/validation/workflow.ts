import { z } from "zod";
import { isActionAllowedForTrigger } from "../domain/actions.js";
import { TELEGRAM_CAPABILITIES, TELEGRAM_METHODS, TELEGRAM_TRIGGER_TYPES } from "../telegram/capabilities.js";
import type { ActionPayload, ConditionPayload } from "../types/workflow.js";

const TEMPLATE_FIELD_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const ALLOWED_TEMPLATE_FIELDS = new Set([
  "event.text",
  "event.chatId",
  "event.chatType",
  "event.fromUserId",
  "event.fromUsername",
  "event.messageId",
  "event.callbackData",
  "event.callbackQueryId",
  "event.command",
  "event.commandArgs",
  "event.inlineQuery",
  "event.inlineQueryId",
  "event.shippingQueryId",
  "event.preCheckoutQueryId",
  "event.targetUserId",
  "event.oldStatus",
  "event.newStatus",
  "vars"
]);

export const triggerSchema = z.enum(TELEGRAM_TRIGGER_TYPES);

export const conditionSchema: z.ZodType<ConditionPayload> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("text_contains"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_starts_with"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_ends_with"), value: z.string().min(1) }),
    z.object({ type: z.literal("from_user_id"), value: z.number().int() }),
    z.object({ type: z.literal("from_username_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("chat_id_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("chat_type_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("message_source_equals"), value: z.enum(["user", "channel", "group"]) }),
    z.object({ type: z.literal("variable_equals"), key: z.string().min(1), value: z.string() }),
    z.object({ type: z.literal("variable_exists"), key: z.string().min(1) }),
    z.object({ type: z.literal("callback_data_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("callback_data_contains"), value: z.string().min(1) }),
    z.object({ type: z.literal("command_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("command_args_contains"), value: z.string().min(1) }),
    z.object({ type: z.literal("inline_query_contains"), value: z.string().min(1) }),
    z.object({ type: z.literal("target_user_id_equals"), value: z.number().int() }),
    z.object({ type: z.literal("old_status_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("new_status_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("message_has_photo") }),
    z.object({ type: z.literal("message_has_video") }),
    z.object({ type: z.literal("message_has_document") }),
    z.object({ type: z.literal("message_has_sticker") }),
    z.object({ type: z.literal("message_has_location") }),
    z.object({ type: z.literal("message_has_contact") }),
    z.object({ type: z.literal("all"), conditions: z.array(conditionSchema).min(1) }),
    z.object({ type: z.literal("any"), conditions: z.array(conditionSchema).min(1) })
  ])
);

export const actionSchema: z.ZodType<ActionPayload> = z
  .object({
    type: z.string().min(1),
    params: z.record(z.string(), z.unknown())
  })
  .strict()
  .superRefine((input, ctx) => {
    if (!input.type.startsWith("telegram.")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type"],
        message: "Action type must start with telegram."
      });
      return;
    }

    const method = input.type.replace("telegram.", "");
    if (!TELEGRAM_METHODS.includes(method as (typeof TELEGRAM_METHODS)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type"],
        message: `Unsupported telegram action type: ${input.type}`
      });
      return;
    }

    const paramsSchema = TELEGRAM_CAPABILITIES[method as (typeof TELEGRAM_METHODS)[number]].paramsSchema;
    const parsed = paramsSchema.safeParse(input.params);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["params", ...issue.path]
        });
      }
    }
  })
  .transform((input) => ({
    type: input.type,
    params: input.params
  })) as z.ZodType<ActionPayload>;

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
  targetHandle: z.string().optional(),
  label: z.string().optional()
});

function collectTemplateStrings(value: unknown, out: string[]) {
  if (typeof value === "string") {
    out.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTemplateStrings(item, out);
    }
    return;
  }

  if (typeof value === "object" && value !== null) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectTemplateStrings(nested, out);
    }
  }
}

function validateTemplates(action: ActionPayload, ctx: z.RefinementCtx, nodeId: string) {
  const values: string[] = [];
  collectTemplateStrings(action.params, values);

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

    const startNode = starts[0];
    if (startNode) {
      const reachable = new Set<string>();
      const stack = [startNode.id];

      while (stack.length > 0) {
        const nodeId = stack.pop();
        if (!nodeId || reachable.has(nodeId)) {
          continue;
        }

        reachable.add(nodeId);
        const neighbors = adjacency.get(nodeId) ?? [];
        for (const neighborId of neighbors) {
          if (!reachable.has(neighborId)) {
            stack.push(neighborId);
          }
        }
      }

      for (const node of flow.nodes) {
        if (!reachable.has(node.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Node ${node.id} is not reachable from the start node.`
          });
        }
      }
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

      const action = node.data as ActionPayload;
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
