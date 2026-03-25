import { verifyWebhook } from "@clerk/nextjs/webhooks";

export type ClerkWebhookEvent = Awaited<ReturnType<typeof verifyWebhook>>;

export async function verifyClerkWebhook(req: Request, signingSecret: string): Promise<ClerkWebhookEvent> {
  return verifyWebhook(req as Parameters<typeof verifyWebhook>[0], { signingSecret });
}
