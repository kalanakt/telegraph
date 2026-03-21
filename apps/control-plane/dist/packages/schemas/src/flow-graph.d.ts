import { z } from 'zod';
export declare const FlowEdge: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    target: z.ZodString;
    sourceHandle: z.ZodOptional<z.ZodString>;
    targetHandle: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    source: string;
    target: string;
    label?: string | undefined;
    sourceHandle?: string | undefined;
    targetHandle?: string | undefined;
}, {
    id: string;
    source: string;
    target: string;
    label?: string | undefined;
    sourceHandle?: string | undefined;
    targetHandle?: string | undefined;
}>;
export type FlowEdge = z.infer<typeof FlowEdge>;
export declare const FlowGraph: z.ZodObject<{
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["command_trigger", "message_trigger", "callback_trigger", "send_message", "send_media", "http_request", "ai_prompt", "condition", "set_variable", "wait_for_input"]>;
        config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        position: {
            x: number;
            y: number;
        };
        label?: string | undefined;
    }, {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        position: {
            x: number;
            y: number;
        };
        label?: string | undefined;
    }>, "many">;
    edges: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodString;
        target: z.ZodString;
        sourceHandle: z.ZodOptional<z.ZodString>;
        targetHandle: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        source: string;
        target: string;
        label?: string | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
    }, {
        id: string;
        source: string;
        target: string;
        label?: string | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    nodes: {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        position: {
            x: number;
            y: number;
        };
        label?: string | undefined;
    }[];
    edges: {
        id: string;
        source: string;
        target: string;
        label?: string | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
    }[];
}, {
    nodes: {
        config: Record<string, unknown>;
        id: string;
        type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
        position: {
            x: number;
            y: number;
        };
        label?: string | undefined;
    }[];
    edges: {
        id: string;
        source: string;
        target: string;
        label?: string | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
    }[];
}>;
export type FlowGraph = z.infer<typeof FlowGraph>;
//# sourceMappingURL=flow-graph.d.ts.map