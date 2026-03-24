import { verifyWebhook } from "@clerk/nextjs/webhooks";

export async function verifyClerkWebhook(req: Request, signingSecret: string) {
  return verifyWebhook(req as Parameters<typeof verifyWebhook>[0], { signingSecret });
}
