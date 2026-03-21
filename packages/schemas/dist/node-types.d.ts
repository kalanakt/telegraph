import { z } from 'zod';
export declare const NodeType: z.ZodEnum<["command_trigger", "message_trigger", "callback_trigger", "send_message", "send_media", "http_request", "ai_prompt", "condition", "set_variable", "wait_for_input"]>;
export type NodeType = z.infer<typeof NodeType>;
export declare const CommandTriggerConfig: z.ZodObject<{
    command: z.ZodString;
}, "strip", z.ZodTypeAny, {
    command: string;
}, {
    command: string;
}>;
export declare const MessageTriggerConfig: z.ZodObject<{
    pattern: z.ZodString;
    matchType: z.ZodEnum<["exact", "contains", "regex"]>;
}, "strip", z.ZodTypeAny, {
    pattern: string;
    matchType: "exact" | "contains" | "regex";
}, {
    pattern: string;
    matchType: "exact" | "contains" | "regex";
}>;
export declare const CallbackTriggerConfig: z.ZodObject<{
    callbackData: z.ZodString;
}, "strip", z.ZodTypeAny, {
    callbackData: string;
}, {
    callbackData: string;
}>;
export declare const SendMessageConfig: z.ZodObject<{
    text: z.ZodString;
    parseMode: z.ZodOptional<z.ZodEnum<["HTML", "Markdown", "MarkdownV2"]>>;
    replyMarkup: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    text: string;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2" | undefined;
    replyMarkup?: any;
}, {
    text: string;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2" | undefined;
    replyMarkup?: any;
}>;
export declare const SendMediaConfig: z.ZodObject<{
    mediaType: z.ZodEnum<["photo", "video", "document", "audio"]>;
    url: z.ZodOptional<z.ZodString>;
    fileId: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mediaType: "photo" | "video" | "document" | "audio";
    url?: string | undefined;
    fileId?: string | undefined;
    caption?: string | undefined;
}, {
    mediaType: "photo" | "video" | "document" | "audio";
    url?: string | undefined;
    fileId?: string | undefined;
    caption?: string | undefined;
}>;
export declare const HttpRequestConfig: z.ZodObject<{
    method: z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>;
    url: z.ZodString;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodString>;
    responseVariable: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    responseVariable: string;
    headers?: Record<string, string> | undefined;
    body?: string | undefined;
}, {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    responseVariable: string;
    headers?: Record<string, string> | undefined;
    body?: string | undefined;
}>;
export declare const AiPromptConfig: z.ZodObject<{
    systemPrompt: z.ZodOptional<z.ZodString>;
    userPromptTemplate: z.ZodString;
    model: z.ZodDefault<z.ZodString>;
    responseVariable: z.ZodString;
}, "strip", z.ZodTypeAny, {
    responseVariable: string;
    userPromptTemplate: string;
    model: string;
    systemPrompt?: string | undefined;
}, {
    responseVariable: string;
    userPromptTemplate: string;
    systemPrompt?: string | undefined;
    model?: string | undefined;
}>;
export declare const ConditionRule: z.ZodObject<{
    variable: z.ZodString;
    operator: z.ZodEnum<["eq", "neq", "contains", "gt", "lt", "regex"]>;
    value: z.ZodString;
    targetEdgeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: string;
    variable: string;
    operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
    targetEdgeId: string;
}, {
    value: string;
    variable: string;
    operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
    targetEdgeId: string;
}>;
export declare const ConditionConfig: z.ZodObject<{
    rules: z.ZodArray<z.ZodObject<{
        variable: z.ZodString;
        operator: z.ZodEnum<["eq", "neq", "contains", "gt", "lt", "regex"]>;
        value: z.ZodString;
        targetEdgeId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        variable: string;
        operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
        targetEdgeId: string;
    }, {
        value: string;
        variable: string;
        operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
        targetEdgeId: string;
    }>, "many">;
    defaultEdgeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rules: {
        value: string;
        variable: string;
        operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
        targetEdgeId: string;
    }[];
    defaultEdgeId?: string | undefined;
}, {
    rules: {
        value: string;
        variable: string;
        operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
        targetEdgeId: string;
    }[];
    defaultEdgeId?: string | undefined;
}>;
export declare const SetVariableConfig: z.ZodObject<{
    variable: z.ZodString;
    valueExpression: z.ZodString;
}, "strip", z.ZodTypeAny, {
    variable: string;
    valueExpression: string;
}, {
    variable: string;
    valueExpression: string;
}>;
export declare const WaitForInputConfig: z.ZodObject<{
    variable: z.ZodString;
    timeoutSecs: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    variable: string;
    timeoutSecs: number;
}, {
    variable: string;
    timeoutSecs?: number | undefined;
}>;
export declare const NodeConfigMap: {
    readonly command_trigger: z.ZodObject<{
        command: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        command: string;
    }, {
        command: string;
    }>;
    readonly message_trigger: z.ZodObject<{
        pattern: z.ZodString;
        matchType: z.ZodEnum<["exact", "contains", "regex"]>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        matchType: "exact" | "contains" | "regex";
    }, {
        pattern: string;
        matchType: "exact" | "contains" | "regex";
    }>;
    readonly callback_trigger: z.ZodObject<{
        callbackData: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        callbackData: string;
    }, {
        callbackData: string;
    }>;
    readonly send_message: z.ZodObject<{
        text: z.ZodString;
        parseMode: z.ZodOptional<z.ZodEnum<["HTML", "Markdown", "MarkdownV2"]>>;
        replyMarkup: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        parseMode?: "HTML" | "Markdown" | "MarkdownV2" | undefined;
        replyMarkup?: any;
    }, {
        text: string;
        parseMode?: "HTML" | "Markdown" | "MarkdownV2" | undefined;
        replyMarkup?: any;
    }>;
    readonly send_media: z.ZodObject<{
        mediaType: z.ZodEnum<["photo", "video", "document", "audio"]>;
        url: z.ZodOptional<z.ZodString>;
        fileId: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        mediaType: "photo" | "video" | "document" | "audio";
        url?: string | undefined;
        fileId?: string | undefined;
        caption?: string | undefined;
    }, {
        mediaType: "photo" | "video" | "document" | "audio";
        url?: string | undefined;
        fileId?: string | undefined;
        caption?: string | undefined;
    }>;
    readonly http_request: z.ZodObject<{
        method: z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>;
        url: z.ZodString;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodString>;
        responseVariable: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        responseVariable: string;
        headers?: Record<string, string> | undefined;
        body?: string | undefined;
    }, {
        url: string;
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        responseVariable: string;
        headers?: Record<string, string> | undefined;
        body?: string | undefined;
    }>;
    readonly ai_prompt: z.ZodObject<{
        systemPrompt: z.ZodOptional<z.ZodString>;
        userPromptTemplate: z.ZodString;
        model: z.ZodDefault<z.ZodString>;
        responseVariable: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        responseVariable: string;
        userPromptTemplate: string;
        model: string;
        systemPrompt?: string | undefined;
    }, {
        responseVariable: string;
        userPromptTemplate: string;
        systemPrompt?: string | undefined;
        model?: string | undefined;
    }>;
    readonly condition: z.ZodObject<{
        rules: z.ZodArray<z.ZodObject<{
            variable: z.ZodString;
            operator: z.ZodEnum<["eq", "neq", "contains", "gt", "lt", "regex"]>;
            value: z.ZodString;
            targetEdgeId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value: string;
            variable: string;
            operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
            targetEdgeId: string;
        }, {
            value: string;
            variable: string;
            operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
            targetEdgeId: string;
        }>, "many">;
        defaultEdgeId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        rules: {
            value: string;
            variable: string;
            operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
            targetEdgeId: string;
        }[];
        defaultEdgeId?: string | undefined;
    }, {
        rules: {
            value: string;
            variable: string;
            operator: "contains" | "regex" | "eq" | "neq" | "gt" | "lt";
            targetEdgeId: string;
        }[];
        defaultEdgeId?: string | undefined;
    }>;
    readonly set_variable: z.ZodObject<{
        variable: z.ZodString;
        valueExpression: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        variable: string;
        valueExpression: string;
    }, {
        variable: string;
        valueExpression: string;
    }>;
    readonly wait_for_input: z.ZodObject<{
        variable: z.ZodString;
        timeoutSecs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        variable: string;
        timeoutSecs: number;
    }, {
        variable: string;
        timeoutSecs?: number | undefined;
    }>;
};
export declare const FlowNode: z.ZodObject<{
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
    type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
    id: string;
    config: Record<string, unknown>;
    position: {
        x: number;
        y: number;
    };
    label?: string | undefined;
}, {
    type: "command_trigger" | "message_trigger" | "callback_trigger" | "send_message" | "send_media" | "http_request" | "ai_prompt" | "condition" | "set_variable" | "wait_for_input";
    id: string;
    config: Record<string, unknown>;
    position: {
        x: number;
        y: number;
    };
    label?: string | undefined;
}>;
export type FlowNode = z.infer<typeof FlowNode>;
//# sourceMappingURL=node-types.d.ts.map