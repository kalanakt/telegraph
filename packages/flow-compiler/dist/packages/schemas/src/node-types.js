import { z } from 'zod';
// Node type enum
export const NodeType = z.enum([
    'command_trigger',
    'message_trigger',
    'callback_trigger',
    'send_message',
    'send_media',
    'http_request',
    'ai_prompt',
    'condition',
    'set_variable',
    'wait_for_input',
]);
// Trigger schemas
export const CommandTriggerConfig = z.object({
    command: z.string().min(1),
});
export const MessageTriggerConfig = z.object({
    pattern: z.string().min(1),
    matchType: z.enum(['exact', 'contains', 'regex']),
});
export const CallbackTriggerConfig = z.object({
    callbackData: z.string().min(1),
});
// Action schemas
export const SendMessageConfig = z.object({
    text: z.string().min(1),
    parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
    replyMarkup: z.any().optional(), // inline keyboard JSON
});
export const SendMediaConfig = z.object({
    mediaType: z.enum(['photo', 'video', 'document', 'audio']),
    url: z.string().optional(),
    fileId: z.string().optional(),
    caption: z.string().optional(),
});
export const HttpRequestConfig = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
    body: z.string().optional(),
    responseVariable: z.string().min(1),
});
export const AiPromptConfig = z.object({
    systemPrompt: z.string().optional(),
    userPromptTemplate: z.string().min(1),
    model: z.string().default('gpt-4o-mini'),
    responseVariable: z.string().min(1),
});
// Condition schema
export const ConditionRule = z.object({
    variable: z.string().min(1),
    operator: z.enum(['eq', 'neq', 'contains', 'gt', 'lt', 'regex']),
    value: z.string(),
    targetEdgeId: z.string().min(1),
});
export const ConditionConfig = z.object({
    rules: z.array(ConditionRule).min(1),
    defaultEdgeId: z.string().optional(),
});
// Flow control schemas
export const SetVariableConfig = z.object({
    variable: z.string().min(1),
    valueExpression: z.string().min(1),
});
export const WaitForInputConfig = z.object({
    variable: z.string().min(1),
    timeoutSecs: z.number().positive().default(300),
});
// Config discriminated union
export const NodeConfigMap = {
    command_trigger: CommandTriggerConfig,
    message_trigger: MessageTriggerConfig,
    callback_trigger: CallbackTriggerConfig,
    send_message: SendMessageConfig,
    send_media: SendMediaConfig,
    http_request: HttpRequestConfig,
    ai_prompt: AiPromptConfig,
    condition: ConditionConfig,
    set_variable: SetVariableConfig,
    wait_for_input: WaitForInputConfig,
};
// Base flow node
export const FlowNode = z.object({
    id: z.string().min(1),
    type: NodeType,
    config: z.record(z.unknown()), // validated per-type
    position: z.object({ x: z.number(), y: z.number() }),
    label: z.string().optional(),
});
//# sourceMappingURL=node-types.js.map