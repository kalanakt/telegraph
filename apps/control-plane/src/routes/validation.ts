import { z } from "zod";

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must use https");

// Auth schemas
export const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  tenantName: z.string().min(1).max(100),
});

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

// Bot schemas
export const CreateBotBody = z.object({
  name: z.string().min(1).max(100),
  token: z.string().min(1).max(200),
  webhookBaseUrl: httpsUrlSchema.optional(),
});

export const UpdateBotBody = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const RegisterWebhookBody = z.object({
  webhookBaseUrl: httpsUrlSchema,
});

export const SendTestMessageBody = z.object({
  chatId: z.union([z.number().int(), z.string().min(1).max(64)]),
  text: z.string().min(1).max(4096),
});

// Flow schemas
export const CreateFlowBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateFlowGraphBody = z.object({
  graph: z.unknown(),
});

/** Type-safe body parser that throws 400 on validation failure */
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw Object.assign(new Error("Validation failed"), {
      statusCode: 400,
      validation: result.error.flatten(),
    });
  }
  return result.data;
}
