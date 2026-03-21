import { z } from 'zod';

// Auth schemas
export const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  tenantName: z.string().min(1).max(100),
  tenantSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
});

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
  tenantSlug: z.string().min(1).max(50),
});

// Bot schemas
export const CreateBotBody = z.object({
  name: z.string().min(1).max(100),
  token: z.string().min(1).max(200),
  username: z.string().max(100).optional(),
});

export const UpdateBotBody = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().max(100).optional(),
});

export const RegisterWebhookBody = z.object({
  webhookBaseUrl: z.string().url(),
});

// Flow schemas
export const CreateFlowBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateFlowGraphBody = z.object({
  graphJson: z.unknown(),
});

/** Type-safe body parser that throws 400 on validation failure */
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw Object.assign(new Error('Validation failed'), {
      statusCode: 400,
      validation: result.error.flatten(),
    });
  }
  return result.data;
}
