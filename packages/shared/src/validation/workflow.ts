import { z } from "zod";
import { isActionAllowedForTrigger } from "../domain/actions.js";
import { isConditionAllowedForTrigger, WORKFLOW_TRIGGER_TYPES } from "../workflow/capabilities.js";
import { TELEGRAM_CAPABILITIES, TELEGRAM_METHODS } from "../telegram/capabilities.js";
import type { ActionPayload, ConditionPayload, FlowDefinition, TriggerType } from "../types/workflow.js";

const TEMPLATE_FIELD_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const ALLOWED_TEMPLATE_PREFIXES = new Set(["event", "vars"]);
const NODE_KEY_REGEX = /^[a-z][a-z0-9_]*$/;
const VAR_PATH_REGEX = /^[a-z][a-z0-9_]*(?:\.[a-zA-Z0-9_]+)*$/;
const VALUE_PATH_REGEX = /^(event|vars)(?:\.[a-zA-Z0-9_]+)*$/;

const recordOfStringsSchema = z.record(z.string(), z.string());
const nodeMetaSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    key: z.string().regex(NODE_KEY_REGEX, "Node key must be snake_case.").optional()
  })
  .strict()
  .optional();

const httpAuthSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("bearer"), token: z.string().min(1) }),
  z.object({ type: z.literal("basic"), username: z.string().min(1), password: z.string() }),
  z.object({ type: z.literal("api_key_header"), header: z.string().min(1), value: z.string().min(1) }),
  z.object({ type: z.literal("api_key_query"), key: z.string().min(1), value: z.string().min(1) })
]);

const jsonValueSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);

export const triggerSchema = z.enum(WORKFLOW_TRIGGER_TYPES);

export const conditionSchema: z.ZodType<ConditionPayload> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("text_contains"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_starts_with"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_ends_with"), value: z.string().min(1) }),
    z.object({ type: z.literal("text_matches_regex"), value: z.string().min(1) }),
    z.object({ type: z.literal("from_user_id"), value: z.number().int() }),
    z.object({ type: z.literal("from_username_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("chat_id_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("chat_type_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("message_source_equals"), value: z.enum(["user", "channel", "group"]) }),
    z.object({ type: z.literal("variable_equals"), key: z.string().min(1), value: z.string() }),
    z.object({ type: z.literal("variable_exists"), key: z.string().min(1) }),
    z.object({ type: z.literal("event_path_exists"), key: z.string().min(1) }),
    z.object({ type: z.literal("event_path_equals"), key: z.string().min(1), value: z.string().min(1) }),
    z.object({ type: z.literal("event_path_contains"), key: z.string().min(1), value: z.string().min(1) }),
    z.object({ type: z.literal("event_path_matches_regex"), key: z.string().min(1), value: z.string().min(1) }),
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
    z.object({ type: z.literal("webhook_method_equals"), value: z.string().min(1) }),
    z.object({ type: z.literal("webhook_header_exists"), key: z.string().min(1) }),
    z.object({ type: z.literal("webhook_header_equals"), key: z.string().min(1), value: z.string().min(1) }),
    z.object({ type: z.literal("webhook_query_equals"), key: z.string().min(1), value: z.string().min(1) }),
    z.object({ type: z.literal("webhook_query_contains"), key: z.string().min(1), value: z.string().min(1) }),
    z.object({ type: z.literal("webhook_body_path_exists"), key: z.string().min(1) }),
    z.object({ type: z.literal("webhook_body_path_equals"), key: z.string().min(1), value: z.string().min(1) }),
    z.object({ type: z.literal("webhook_body_path_contains"), key: z.string().min(1), value: z.string().min(1) }),
    z.object({ type: z.literal("all"), conditions: z.array(conditionSchema).min(1) }),
    z.object({ type: z.literal("any"), conditions: z.array(conditionSchema).min(1) })
  ])
);

const webhookSendSchema = z.object({
  type: z.literal("webhook.send"),
  params: z
    .object({
      url: z.string().url(),
      headers: recordOfStringsSchema.optional(),
      query: recordOfStringsSchema.optional(),
      auth: httpAuthSchema.optional(),
      body: jsonValueSchema.optional(),
      timeout_ms: z.number().int().positive().max(60_000).optional(),
      response_body_format: z.enum(["auto", "json", "text"]).optional()
    })
    .strict()
});

const httpRequestSchema = z.object({
  type: z.literal("http.request"),
  params: z
    .object({
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
      url: z.string().url(),
      headers: recordOfStringsSchema.optional(),
      query: recordOfStringsSchema.optional(),
      auth: httpAuthSchema.optional(),
      body_mode: z.enum(["json", "text"]).optional(),
      body: z.union([jsonValueSchema, z.string()]).optional(),
      timeout_ms: z.number().int().positive().max(60_000).optional(),
      response_body_format: z.enum(["auto", "json", "text"]).optional()
    })
    .strict()
});

export const actionSchema: z.ZodType<ActionPayload> = z
  .object({
    type: z.string().min(1),
    params: z.record(z.string(), z.unknown())
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.type.startsWith("telegram.")) {
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
      return;
    }

    if (input.type === "webhook.send") {
      const parsed = webhookSendSchema.safeParse(input);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue(issue);
        }
      }
      return;
    }

    if (input.type === "http.request") {
      const parsed = httpRequestSchema.safeParse(input);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue(issue);
        }
      }
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type"],
      message: `Unsupported action type: ${input.type}`
    });
  }) as z.ZodType<ActionPayload>;

const flowNodeBaseSchema = z.object({
  id: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  meta: nodeMetaSchema
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

const switchCaseSchema = z
  .object({
    id: z.string().min(1),
    value: z.string(),
    label: z.string().trim().min(1).max(120).optional()
  })
  .strict();

const switchNodeSchema = flowNodeBaseSchema.extend({
  type: z.literal("switch"),
  data: z
    .object({
      path: z.string().regex(VALUE_PATH_REGEX, "Switch path must start with event. or vars."),
      cases: z.array(switchCaseSchema).min(1)
    })
    .strict()
});

const setVariableNodeSchema = flowNodeBaseSchema.extend({
  type: z.literal("set_variable"),
  data: z
    .object({
      path: z.string().regex(VAR_PATH_REGEX, "Variable path must be dot.notation under vars."),
      value: jsonValueSchema
    })
    .strict()
});

const delayNodeSchema = flowNodeBaseSchema.extend({
  type: z.literal("delay"),
  data: z
    .object({
      delay_ms: z.number().int().positive().max(7 * 24 * 60 * 60 * 1000)
    })
    .strict()
});

export const flowNodeSchema = z.discriminatedUnion("type", [
  startNodeSchema,
  conditionNodeSchema,
  actionNodeSchema,
  switchNodeSchema,
  setVariableNodeSchema,
  delayNodeSchema
]);

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
      const [prefix] = token.split(".");
      const isAllowed = prefix ? ALLOWED_TEMPLATE_PREFIXES.has(prefix) : false;
      if (!isAllowed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Node ${nodeId} references unknown template field: ${token}`
        });
      }
    }
  }
}

function validateTemplateValues(value: unknown, ctx: z.RefinementCtx, nodeId: string) {
  const values: string[] = [];
  collectTemplateStrings(value, values);

  for (const item of values) {
    for (const match of item.matchAll(TEMPLATE_FIELD_REGEX)) {
      const token = match[1] ?? "";
      const [prefix] = token.split(".");
      const isAllowed = prefix ? ALLOWED_TEMPLATE_PREFIXES.has(prefix) : false;
      if (!isAllowed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Node ${nodeId} references unknown template field: ${token}`
        });
      }
    }
  }
}

export function validateFlowForTrigger(
  flowDefinition: FlowDefinition,
  trigger: TriggerType,
  ctx: z.RefinementCtx
) {
  for (const node of flowDefinition.nodes) {
    if (node.type === "condition" && !isConditionAllowedForTrigger(node.data.type, trigger)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Condition ${node.data.type} is not allowed for trigger ${trigger}.`
      });
    }

    if (node.type === "action") {
      const action = node.data as ActionPayload;
      if (!isActionAllowedForTrigger(action.type, trigger)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Action ${action.type} is not allowed for trigger ${trigger}.`
        });
      }

      validateTemplates(action, ctx, node.id);
      continue;
    }

    if (node.type === "set_variable") {
      validateTemplateValues(node.data.value, ctx, node.id);
    }
  }
}

export const flowDefinitionSchema: z.ZodType<FlowDefinition> = z
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
    const seenNodeKeys = new Set<string>();
    for (const node of flow.nodes) {
      if (seenNodeIds.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate node id: ${node.id}`
        });
      }
      seenNodeIds.add(node.id);

      const nodeKey = node.meta?.key?.trim();
      if (nodeKey) {
        if (seenNodeKeys.has(nodeKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate node key: ${nodeKey}`
          });
        }
        seenNodeKeys.add(nodeKey);
      }
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
      const outgoing = flow.edges.filter((edge) => edge.source === node.id);

      if (node.type === "condition") {
        const trueEdgeCount = outgoing.filter((edge) => edge.sourceHandle === "true").length;
        const falseEdgeCount = outgoing.filter((edge) => edge.sourceHandle === "false").length;
        if (trueEdgeCount !== 1 || falseEdgeCount > 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Condition node ${node.id} must have exactly one 'true' edge and at most one 'false' edge.`
          });
        }
      }

      if (node.type === "switch") {
        const seenCaseIds = new Set<string>();
        for (const flowCase of node.data.cases) {
          if (flowCase.id === "default") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Switch node ${node.id} cannot use reserved branch id 'default'.`
            });
          }

          if (seenCaseIds.has(flowCase.id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Switch node ${node.id} has duplicate branch id '${flowCase.id}'.`
            });
          }
          seenCaseIds.add(flowCase.id);
        }

        const allowedHandles = new Set(node.data.cases.map((item) => item.id));
        allowedHandles.add("default");

        const seenHandles = new Set<string>();
        for (const edge of outgoing) {
          const handle = edge.sourceHandle ?? "default";
          if (!allowedHandles.has(handle)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Switch node ${node.id} has an edge for unknown branch '${handle}'.`
            });
          }

          if (seenHandles.has(handle)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Switch node ${node.id} cannot have multiple edges for branch '${handle}'.`
            });
          }
          seenHandles.add(handle);
        }

        for (const flowCase of node.data.cases) {
          if (!seenHandles.has(flowCase.id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Switch node ${node.id} must connect branch '${flowCase.id}'.`
            });
          }
        }
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
  }) as z.ZodType<FlowDefinition>;

export const createFlowSchema = z
  .object({
    botId: z.string().min(1),
    name: z.string().min(1).max(120),
    trigger: triggerSchema,
    flowDefinition: flowDefinitionSchema
  })
  .superRefine((flow, ctx) => {
    validateFlowForTrigger(flow.flowDefinition, flow.trigger, ctx);
  });

export const addBotSchema = z.object({
  token: z.string().min(10)
});
