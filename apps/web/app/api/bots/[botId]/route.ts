import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { decrypt, requestTelegram, telegramDeleteWebhook, telegramGetMe } from "@telegram-builder/shared";
import { getWebRuntimeEnv } from "@/lib/env";
import { logInfo, logWarn } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function PATCH(_: Request, context: { params: Promise<{ botId: string }> }) {
  try {
    getWebRuntimeEnv();
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

    const webhookBase = process.env.TELEGRAM_WEBHOOK_BASE_URL;
    if (!webhookBase) {
      return NextResponse.json({ error: "TELEGRAM_WEBHOOK_BASE_URL is required" }, { status: 500 });
    }

    const token = decrypt(bot.encryptedToken);
    const me = await telegramGetMe(token);
    if (!me.ok || !me.result) {
      await prisma.bot.update({
        where: { id: bot.id },
        data: { status: "invalid_token" }
      });

      return NextResponse.json({ error: "Stored bot token is no longer valid" }, { status: 400 });
    }

    const webhookUrl = `${webhookBase}/${bot.id}`;
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
    const webhookResult = await requestTelegram(token, "setWebhook", {
      url: webhookUrl,
      ...(secretToken ? { secret_token: secretToken } : {}),
      allowed_updates: [
        "message",
        "edited_message",
        "channel_post",
        "edited_channel_post",
        "callback_query",
        "inline_query",
        "chosen_inline_result",
        "shipping_query",
        "pre_checkout_query",
        "poll",
        "poll_answer",
        "chat_member",
        "my_chat_member",
        "chat_join_request",
        "message_reaction",
        "message_reaction_count"
      ]
    });

    if (!webhookResult.ok) {
      await prisma.bot.update({
        where: { id: bot.id },
        data: { status: "webhook_error" }
      });

      logWarn("bot_reconnect_failed", {
        botId: bot.id,
        route: "patch-bot",
        webhookUrl,
        code: webhookResult.errorCode,
        description: webhookResult.description
      });

      return NextResponse.json(
        {
          error: webhookResult.description ?? "Webhook reconnect failed",
          details: {
            code: webhookResult.errorCode,
            webhookUrl
          }
        },
        { status: 502 }
      );
    }

    await prisma.bot.update({
      where: { id: bot.id },
      data: { status: "active" }
    });

    logInfo("bot_reconnected", {
      botId: bot.id,
      route: "patch-bot"
    });

    return NextResponse.json({ reconnected: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    Sentry.captureException(error, {
      tags: {
        area: "bot-reconnect",
        route: "patch-bot"
      }
    });

    return NextResponse.json({ error: "Failed to reconnect bot" }, { status: 400 });
  }
}

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
