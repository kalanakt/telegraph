import { NextResponse } from "next/server";
import { asJsonValue } from "@telegram-builder/shared";
import { buildWebhookEvent, getWebhookSignatureHeaderName, makeWebhookRequestId, parseWebhookSecret } from "@/lib/flow-webhooks";
import { getAutomationOrchestrator } from "@/lib/orchestrator/service";
import { prisma } from "@/lib/prisma";

function tryParseBody(bodyRaw: string) {
  if (!bodyRaw.trim()) {
    return null;
  }

  try {
    return asJsonValue(JSON.parse(bodyRaw));
  } catch {
    return asJsonValue(bodyRaw);
  }
}

export async function POST(req: Request, context: { params: Promise<{ endpointId: string }> }) {
  const { endpointId } = await context.params;
  const endpoint = await prisma.flowWebhookEndpoint.findUnique({
    where: { endpointId },
    include: {
      rule: true
    }
  });

  if (!endpoint || !endpoint.enabled || endpoint.rule.trigger !== "webhook.received" || !endpoint.rule.enabled) {
    return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
  }

  const expectedHeader = endpoint.signatureHeaderName
    ? getWebhookSignatureHeaderName(endpoint.signatureHeaderName)
    : null;
  const expectedSecret = parseWebhookSecret(endpoint);
  if (expectedHeader && expectedSecret) {
    const provided = req.headers.get(expectedHeader);
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const bodyRaw = await req.text();
  const url = new URL(req.url);
  const requestId = makeWebhookRequestId(endpointId, bodyRaw, req.headers.get("x-idempotency-key"));
  const event = buildWebhookEvent({
    endpointId,
    requestId,
    url,
    method: req.method,
    headers: req.headers,
    bodyRaw,
    body: tryParseBody(bodyRaw)
  });

  const result = await getAutomationOrchestrator().handleIncomingWebhook({
    ruleId: endpoint.ruleId,
    event,
    receivedAt: new Date()
  });

  return NextResponse.json(result, { status: 202 });
}
