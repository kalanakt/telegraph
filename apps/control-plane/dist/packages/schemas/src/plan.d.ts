import { z } from 'zod';
export declare const PlanEdge: z.ZodObject<{
    condition: z.ZodOptional<z.ZodString>;
    targetNodeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetNodeId: string;
    condition?: string | undefined;
}, {
    targetNodeId: string;
    condition?: string | undefined;
}>;
export declare const PlanNode: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["command_trigger", "message_trigger", "callback_trigger", "send_message", "send_media", "http_request", "ai_prompt", "condition", "set_variable", "wait_for_input"]>;
    config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    edges: z.ZodArray<z.ZodObject<{
        condition: z.ZodOptional<z.ZodString>;
        targetNodeId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        targetNodeId: string;
        condition?: string | undefined;
    }, {
        targetNodeId: string;
        condition?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    config: Record<string, unknown>;
    id: string;
    type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
    edges: {
        targetNodeId: string;
        condition?: string | undefined;
    }[];
}, {
    config: Record<string, unknown>;
    id: string;
    type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
    edges: {
        targetNodeId: string;
        condition?: string | undefined;
    }[];
}>;
export type PlanNode = z.infer<typeof PlanNode>;
export declare const TriggerMapping: z.ZodObject<{
    type: z.ZodEnum<["command", "message", "callback_query"]>;
    pattern: z.ZodString;
    entryNodeId: z.ZodString;
    matchType: z.ZodOptional<z.ZodEnum<["exact", "contains", "regex"]>>;
}, "strip", z.ZodTypeAny, {
    type: "message" | "command" | "callback_query";
    pattern: string;
    entryNodeId: string;
    matchType?: "exact" | "contains" | "regex" | undefined;
}, {
    type: "message" | "command" | "callback_query";
    pattern: string;
    entryNodeId: string;
    matchType?: "exact" | "contains" | "regex" | undefined;
}>;
export type TriggerMapping = z.infer<typeof TriggerMapping>;
export declare const ExecutionPlan: z.ZodObject<{
    id: z.ZodString;
    flowId: z.ZodString;
    version: z.ZodNumber;
    triggers: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["command", "message", "callback_query"]>;
        pattern: z.ZodString;
        entryNodeId: z.ZodString;
        matchType: z.ZodOptional<z.ZodEnum<["exact", "contains", "regex"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "message" | "command" | "callback_query";
        pattern: string;
        entryNodeId: string;
        matchType?: "exact" | "contains" | "regex" | undefined;
    }, {
        type: "message" | "command" | "callback_query";
        pattern: string;
        entryNodeId: string;
        matchType?: "exact" | "contains" | "regex" | undefined;
    }>, "many">;
    nodes: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["command_trigger", "message_trigger", "callback_trigger", "send_message", "send_media", "http_request", "ai_prompt", "condition", "set_variable", "wait_for_input"]>;
        config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        edges: z.ZodArray<z.ZodObject<{
            condition: z.ZodOptional<z.ZodString>;
            targetNodeId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            targetNodeId: string;
            condition?: string | undefined;
        }, {
            targetNodeId: string;
            condition?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        edges: {
            targetNodeId: string;
            condition?: string | undefined;
        }[];
    }, {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        edges: {
            targetNodeId: string;
            condition?: string | undefined;
        }[];
    }>>;
    metadata: z.ZodObject<{
        compiledAt: z.ZodString;
        nodeCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        compiledAt: string;
        nodeCount: number;
    }, {
        compiledAt: string;
        nodeCount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    version: number;
    id: string;
    flowId: string;
    nodes: Record<string, {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        edges: {
            targetNodeId: string;
            condition?: string | undefined;
        }[];
    }>;
    triggers: {
        type: "message" | "command" | "callback_query";
        pattern: string;
        entryNodeId: string;
        matchType?: "exact" | "contains" | "regex" | undefined;
    }[];
    metadata: {
        compiledAt: string;
        nodeCount: number;
    };
}, {
    version: number;
    id: string;
    flowId: string;
    nodes: Record<string, {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        edges: {
            targetNodeId: string;
            condition?: string | undefined;
        }[];
    }>;
    triggers: {
        type: "message" | "command" | "callback_query";
        pattern: string;
        entryNodeId: string;
        matchType?: "exact" | "contains" | "regex" | undefined;
    }[];
    metadata: {
        compiledAt: string;
        nodeCount: number;
    };
}>;
export type ExecutionPlan = z.infer<typeof ExecutionPlan>;
export declare const CallbackTokenMap: z.ZodRecord<z.ZodString, z.ZodObject<{
    nodeId: z.ZodString;
    planId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nodeId: string;
    planId: string;
}, {
    nodeId: string;
    planId: string;
}>>;
export type CallbackTokenMap = z.infer<typeof CallbackTokenMap>;
//# sourceMappingURL=plan.d.ts.map