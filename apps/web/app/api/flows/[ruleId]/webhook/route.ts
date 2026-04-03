import { NextResponse } from "next/server";
import { createWebhookSecret, getWebhookSignatureHeaderName, serializeWebhookSecret } from "@/lib/flow-webhooks";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function GET(_: Request, context: { params: Promise<{ ruleId: string }> }) {
  try {
    const user = await requireAppUser();
    const { ruleId } = await context.params;

    const endpoint = await prisma.flowWebhookEndpoint.findFirst({
      where: {
        ruleId,
        rule: {
          userId: user.id
        }
      }
    });

    if (!endpoint) {
      return NextResponse.json({ endpoint: null });
    }

    return NextResponse.json({ endpoint });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ ruleId: string }> }) {
  try {
    const user = await requireAppUser();
    const { ruleId } = await context.params;
    const json = (await req.json()) as {
      action?: "rotate_secret" | "toggle_enabled" | "update_signature_header";
      enabled?: boolean;
      signatureHeaderName?: string | null;
    };

    const existing = await prisma.flowWebhookEndpoint.findFirst({
      where: {
        ruleId,
        rule: {
          userId: user.id
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
    }

    const endpoint = await prisma.flowWebhookEndpoint.update({
      where: { id: existing.id },
      data:
        json.action === "rotate_secret"
          ? {
              encryptedSecret: serializeWebhookSecret(createWebhookSecret())
            }
          : json.action === "toggle_enabled"
          ? {
              enabled: Boolean(json.enabled)
            }
          : {
              signatureHeaderName: json.signatureHeaderName
                ? getWebhookSignatureHeaderName(json.signatureHeaderName)
                : null
            }
    });

    return NextResponse.json({ endpoint });
  } catch {
    return NextResponse.json({ error: "Failed to update webhook endpoint" }, { status: 400 });
  }
}
