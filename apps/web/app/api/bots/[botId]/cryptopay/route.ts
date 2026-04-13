import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cryptoPayGetMe, decrypt, encrypt } from "@telegram-builder/shared";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

function normalizeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    const issues = error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
      .filter((issue) => issue.length > 0);

    return issues.length > 0 ? issues.join(", ") : fallback;
  }

  if (typeof error === "string") {
    const normalized = error.trim();
    return normalized.length > 0 ? normalized : fallback;
  }

  if (error instanceof Error) {
    const normalized = error.message.trim();
    return normalized.length > 0 ? normalized : fallback;
  }

  if (Array.isArray(error)) {
    const parts: string[] = error
      .map((item) => normalizeErrorMessage(item, ""))
      .filter((item) => item.length > 0);
    return parts.length > 0 ? parts.join(", ") : fallback;
  }

  if (error && typeof error === "object") {
    const candidate = error as Record<string, unknown>;

    for (const key of ["error", "message", "detail", "description"]) {
      if (key in candidate) {
        return normalizeErrorMessage(candidate[key], fallback);
      }
    }

    try {
      const serialized = JSON.stringify(candidate);
      return serialized.length > 0 ? serialized : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

const webhookUrlSchema = z
  .union([z.string().trim().url(), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  });

const connectCryptoPaySchema = z.object({
  token: z.string().trim().min(1),
  useTestnet: z.boolean().optional()
});

const updateCryptoPayWebhookSchema = z.object({
  webhookUrl: webhookUrlSchema
});

function buildWebhookUrl(request: Request, botId: string, secret: string) {
  return new URL(`/api/cryptopay/webhook/${botId}/${secret}`, request.url).toString();
}

async function findOwnedBot(userId: string, botId: string) {
  return prisma.bot.findFirst({
    where: {
      id: botId,
      userId
    }
  });
}

function serializeConnection(
  request: Request,
  bot: {
    encryptedCryptoPayToken: string | null;
    encryptedCryptoPayWebhookSecret: string | null;
    cryptoPayCustomWebhookUrl: string | null;
    cryptoPayAppId: string | null;
    cryptoPayAppName: string | null;
    cryptoPayUseTestnet: boolean;
    cryptoPayConnectedAt: Date | null;
    id: string;
  }
) {
  const secret = bot.encryptedCryptoPayWebhookSecret ? decrypt(bot.encryptedCryptoPayWebhookSecret) : null;
  const defaultWebhookUrl = secret ? buildWebhookUrl(request, bot.id, secret) : null;

  return {
    connected: Boolean(bot.encryptedCryptoPayToken),
    appId: bot.cryptoPayAppId,
    appName: bot.cryptoPayAppName,
    useTestnet: bot.cryptoPayUseTestnet,
    connectedAt: bot.cryptoPayConnectedAt?.toISOString() ?? null,
    defaultWebhookUrl,
    customWebhookUrl: bot.cryptoPayCustomWebhookUrl,
    webhookUrl: defaultWebhookUrl
  };
}

export async function GET(req: Request, context: { params: Promise<{ botId: string }> }) {
  try {
    const user = await requireAppUser();
    const { botId } = await context.params;
    const bot = await findOwnedBot(user.id, botId);

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json(serializeConnection(req, bot));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to load Crypto Pay settings" }, { status: 400 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ botId: string }> }) {
  try {
    const user = await requireAppUser();
    const { botId } = await context.params;
    const bot = await findOwnedBot(user.id, botId);

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const data = connectCryptoPaySchema.parse(await req.json());
    const app = await cryptoPayGetMe(data.token, {
      useTestnet: data.useTestnet ?? false
    });
    const webhookSecret = bot.encryptedCryptoPayWebhookSecret
      ? decrypt(bot.encryptedCryptoPayWebhookSecret)
      : randomBytes(24).toString("hex");

    const updated = await prisma.bot.update({
      where: { id: bot.id },
      data: {
        encryptedCryptoPayToken: encrypt(data.token),
        encryptedCryptoPayWebhookSecret: encrypt(webhookSecret),
        cryptoPayCustomWebhookUrl: null,
        cryptoPayAppId:
          typeof app.app_id === "number" || typeof app.app_id === "string" ? String(app.app_id) : null,
        cryptoPayAppName: typeof app.name === "string" ? app.name : null,
        cryptoPayUseTestnet: data.useTestnet ?? false,
        cryptoPayConnectedAt: new Date()
      }
    });

    return NextResponse.json(serializeConnection(req, updated));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = normalizeErrorMessage(error, "Failed to connect Crypto Pay");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ botId: string }> }) {
  try {
    const user = await requireAppUser();
    const { botId } = await context.params;
    const bot = await findOwnedBot(user.id, botId);

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const data = updateCryptoPayWebhookSchema.parse(await req.json());
    const updated = await prisma.bot.update({
      where: { id: bot.id },
      data: {
        cryptoPayCustomWebhookUrl: data.webhookUrl
      }
    });

    return NextResponse.json(serializeConnection(req, updated));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = normalizeErrorMessage(error, "Failed to update Crypto Pay webhook");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ botId: string }> }) {
  try {
    const user = await requireAppUser();
    const { botId } = await context.params;
    const bot = await findOwnedBot(user.id, botId);

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const updated = await prisma.bot.update({
      where: { id: bot.id },
      data: {
        encryptedCryptoPayToken: null,
        encryptedCryptoPayWebhookSecret: null,
        cryptoPayCustomWebhookUrl: null,
        cryptoPayAppId: null,
        cryptoPayAppName: null,
        cryptoPayUseTestnet: false,
        cryptoPayConnectedAt: null
      }
    });

    return NextResponse.json(serializeConnection(req, updated));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to disconnect Crypto Pay" }, { status: 400 });
  }
}
