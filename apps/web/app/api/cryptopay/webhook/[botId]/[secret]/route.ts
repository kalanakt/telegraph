import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NormalizedEvent } from "@telegram-builder/shared";
import { decrypt } from "@telegram-builder/shared";
import { Prisma } from "@prisma/client";
import { getAutomationOrchestrator } from "@/lib/orchestrator/service";
import { prisma } from "@/lib/prisma";

function matchesSecret(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function matchesSignature(token: string, bodyRaw: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const secret = createHash("sha256").update(token).digest();
  const digest = createHmac("sha256", secret).update(bodyRaw).digest("hex");
  const left = Buffer.from(digest);
  const right = Buffer.from(signature);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPrismaJsonValue(item)) as Prisma.InputJsonArray;
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, toPrismaJsonValue(nested)])
    ) as Prisma.InputJsonObject;
  }

  return String(value);
}

export async function POST(req: Request, context: { params: Promise<{ botId: string; secret: string }> }) {
  const { botId, secret } = await context.params;
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: {
      encryptedCryptoPayToken: true,
      encryptedCryptoPayWebhookSecret: true
    }
  });

  if (!bot?.encryptedCryptoPayToken || !bot.encryptedCryptoPayWebhookSecret) {
    return NextResponse.json({ error: "Crypto Pay is not configured" }, { status: 404 });
  }

  const expectedSecret = decrypt(bot.encryptedCryptoPayWebhookSecret);
  if (!matchesSecret(expectedSecret, secret)) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  const bodyRaw = await req.text();
  const signature = req.headers.get("crypto-pay-api-signature");
  const token = decrypt(bot.encryptedCryptoPayToken);

  if (!matchesSignature(token, bodyRaw, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: {
    update_type?: string;
    payload?: {
      payload?: string | null;
      hash?: string | null;
      invoice_id?: number | null;
      status?: string | null;
      paid_at?: string | null;
      paid_amount?: string | null;
      paid_asset?: string | null;
      [key: string]: unknown;
    };
  };

  try {
    payload = JSON.parse(bodyRaw) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (payload.update_type !== "invoice_paid" || !payload.payload) {
    return NextResponse.json({ ok: true });
  }

  const invoice = payload.payload;
  const invoicePayload = typeof invoice.payload === "string" ? invoice.payload : null;
  if (!invoicePayload) {
    return NextResponse.json({ ok: true });
  }

  const orders = await prisma.commerceOrder.findMany({
    where: {
      botId,
      invoicePayload
    },
    select: {
      id: true,
      attributes: true,
      session: {
        select: {
          id: true,
          chatId: true
        }
      },
      customerProfile: {
        select: {
          id: true,
          telegramUserId: true,
          chatId: true,
          username: true
        }
      }
    }
  });

  const orchestrator = getAutomationOrchestrator();

  await Promise.all(
    orders.map(async (order, index) => {
      await prisma.commerceOrder.update({
        where: { id: order.id },
        data: {
          status: "paid",
          paidAt: invoice.paid_at ? new Date(invoice.paid_at) : new Date(),
          attributes: toPrismaJsonValue({
            ...((order.attributes as Record<string, unknown> | null) ?? {}),
            cryptoPayInvoiceId: invoice.invoice_id ?? null,
            cryptoPayInvoiceHash: invoice.hash ?? null,
            cryptoPayStatus: invoice.status ?? "paid",
            cryptoPayPaidAmount: invoice.paid_amount ?? null,
            cryptoPayPaidAsset: invoice.paid_asset ?? null,
            cryptoPayInvoice: invoice
          })
        }
      });

      const chatId = order.customerProfile?.chatId ?? order.session?.chatId ?? undefined;
      const fromUserId = order.customerProfile?.telegramUserId ? Number(order.customerProfile.telegramUserId) : undefined;
      const event: NormalizedEvent = {
        source: "cryptopay",
        trigger: "cryptopay.invoice_paid",
        eventId: `cryptopay:${invoice.invoice_id ?? invoice.hash ?? invoicePayload}:${order.id}`,
        updateId: invoice.invoice_id ?? index,
        chatId,
        fromUserId,
        fromUsername: order.customerProfile?.username ?? undefined,
        messageSource: "user",
        text: "",
        invoicePayload,
        cryptoPayInvoiceId: invoice.invoice_id ?? undefined,
        cryptoPayInvoiceHash: invoice.hash ?? undefined,
        cryptoPayStatus: invoice.status ?? "paid",
        cryptoPayPaidAmount: invoice.paid_amount ?? undefined,
        cryptoPayPaidAsset: invoice.paid_asset ?? undefined,
        variables: {}
      };

      await orchestrator.handleIncomingEvent({
        botId,
        event,
        receivedAt: invoice.paid_at ? new Date(invoice.paid_at) : new Date()
      });
    })
  );

  return NextResponse.json({ ok: true });
}
