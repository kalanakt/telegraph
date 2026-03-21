import { z } from 'zod';
export declare const RegisterBody: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    tenantName: z.ZodString;
    tenantSlug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    tenantName: string;
    tenantSlug: string;
}, {
    email: string;
    password: string;
    tenantName: string;
    tenantSlug: string;
}>;
export declare const LoginBody: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    tenantSlug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    tenantSlug: string;
}, {
    email: string;
    password: string;
    tenantSlug: string;
}>;
export declare const CreateBotBody: z.ZodObject<{
    name: z.ZodString;
    token: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    token: string;
    username?: string | undefined;
}, {
    name: string;
    token: string;
    username?: string | undefined;
}>;
export declare const UpdateBotBody: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    username?: string | undefined;
}, {
    name?: string | undefined;
    username?: string | undefined;
}>;
export declare const RegisterWebhookBody: z.ZodObject<{
    webhookBaseUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    webhookBaseUrl: string;
}, {
    webhookBaseUrl: string;
}>;
export declare const CreateFlowBody: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
}>;
export declare const UpdateFlowGraphBody: z.ZodObject<{
    graphJson: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    graphJson?: unknown;
}, {
    graphJson?: unknown;
}>;
/** Type-safe body parser that throws 400 on validation failure */
export declare function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T;
//# sourceMappingURL=validation.d.ts.map