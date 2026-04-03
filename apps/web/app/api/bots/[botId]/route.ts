import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { decrypt, telegramDeleteWebhook } from "@telegram-builder/shared";
import { logInfo, logWarn } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function DELETE(_: Request, context: { params: Promise<{ botId: string }> }) {
  try {
    const user = await requireAppUser();
    const { botId } = await context.params;

    const bot = await prisma.bot.findFirst({
      where: {
        id: botId,
        userId: user.id
      }
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    let webhookRemoved = false;

    try {
      webhookRemoved = await telegramDeleteWebhook(decrypt(bot.encryptedToken));
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          area: "bot-disconnect",
          route: "delete-bot"
        },
        extra: {
          botId: bot.id
        }
      });
      logWarn("bot_webhook_delete_failed", {
        botId: bot.id,
        error,
        route: "delete-bot"
      });
    }

    await prisma.bot.delete({
      where: { id: bot.id }
    });

    logInfo("bot_deleted", {
      botId: bot.id,
      route: "delete-bot",
      webhookRemoved
    });

    return NextResponse.json({ deleted: true, webhookRemoved });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to delete bot" }, { status: 400 });
  }
}
