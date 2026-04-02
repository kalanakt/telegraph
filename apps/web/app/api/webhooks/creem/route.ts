import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { FlatCheckoutCompleted, FlatSubscriptionEvent } from "@creem_io/nextjs";
import {
  syncSubscriptionMirrorFromCheckoutCompleted,
  syncSubscriptionMirrorFromSubscriptionEvent
} from "@/lib/creem-billing";
import { getCreemWebhookSecret } from "@/lib/creem";

type CreemWebhookPayload = {
  created_at: number;
  eventType: string;
  id: string;
  object: Record<string, unknown>;
};

function parseWebhookPayload(payload: string): CreemWebhookPayload {
  const parsed = JSON.parse(payload) as Partial<CreemWebhookPayload>;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.eventType !== "string" ||
    typeof parsed.id !== "string" ||
    typeof parsed.created_at !== "number" ||
    !parsed.object ||
    typeof parsed.object !== "object"
  ) {
    throw new Error("Invalid webhook payload");
  }

  return parsed as CreemWebhookPayload;
}

function isValidSignature(payload: string, signature: string, secret: string) {
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (computed.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export async function POST(req: Request) {
  const webhookSecret = getCreemWebhookSecret();

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing CREEM_WEBHOOK_SECRET" }, { status: 400 });
  }

  const payload = await req.text();
  const signature = req.headers.get("creem-signature");

  if (!signature || !isValidSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = parseWebhookPayload(payload);

    if (event.eventType === "checkout.completed") {
      await syncSubscriptionMirrorFromCheckoutCompleted({
        ...(event.object as unknown as FlatCheckoutCompleted),
        webhookCreatedAt: event.created_at,
        webhookEventType: event.eventType,
        webhookId: event.id
      });

      return NextResponse.json({ received: true });
    }

    if (
      [
        "subscription.active",
        "subscription.canceled",
        "subscription.expired",
        "subscription.paid",
        "subscription.past_due",
        "subscription.paused",
        "subscription.scheduled_cancel",
        "subscription.trialing",
        "subscription.unpaid",
        "subscription.update"
      ].includes(event.eventType)
    ) {
      await syncSubscriptionMirrorFromSubscriptionEvent({
        ...(event.object as unknown as FlatSubscriptionEvent<string>),
        webhookCreatedAt: event.created_at,
        webhookEventType: event.eventType,
        webhookId: event.id
      });

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ ignored: true, received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
