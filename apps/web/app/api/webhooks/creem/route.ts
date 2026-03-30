import { NextResponse } from "next/server";
import { syncSubscriptionFromCreemEvent } from "@/lib/creem-billing";
import { verifyCreemWebhook } from "@/lib/creem";

export async function POST(req: Request) {
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing Creem webhook secret" }, { status: 400 });
  }

  try {
    const event = await verifyCreemWebhook(req, webhookSecret);
    await syncSubscriptionFromCreemEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    const status = message.toLowerCase().includes("signature") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

