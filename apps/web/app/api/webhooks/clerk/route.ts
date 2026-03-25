import { NextResponse } from "next/server";
import { syncSubscriptionMirrorFromWebhookEvent } from "@/lib/clerk-billing";
import { verifyClerkWebhook } from "@/lib/clerk-webhooks";

function shouldHandleEvent(eventType: string): boolean {
  const normalized = eventType.toLowerCase();
  return normalized.includes("billing.subscription") || normalized.includes("subscription.");
}

export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json({ error: "Missing Clerk webhook signing secret" }, { status: 400 });
  }

  try {
    const event = await verifyClerkWebhook(req, signingSecret);
    const type = typeof event.type === "string" ? event.type : "";

    if (shouldHandleEvent(type)) {
      await syncSubscriptionMirrorFromWebhookEvent(event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
