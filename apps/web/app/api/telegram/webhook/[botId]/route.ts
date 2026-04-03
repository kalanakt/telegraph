import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { TelegramUpdate } from "@telegram-builder/shared";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { getAutomationOrchestrator } from "@/lib/orchestrator/service";

export async function POST(req: Request, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const orchestrator = getAutomationOrchestrator();

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
  if (expectedSecret) {
    const provided = req.headers.get("x-telegram-bot-api-secret-token");
    if (provided !== expectedSecret) {
      Sentry.captureMessage("Telegram webhook secret rejected", {
        level: "warning",
        tags: {
          area: "telegram-webhook",
          route: "telegram-webhook-reject"
        },
        extra: {
          botId
        }
      });
      logWarn("webhook_unauthorized", { botId, route: "telegram-webhook", statusCode: 401 });
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const update = (await req.json()) as TelegramUpdate;

    logInfo("webhook_received", {
      botId,
      route: "telegram-webhook",
      updateId: update.update_id
    });

    const result = await orchestrator.handleIncomingUpdate({
      botId,
      telegramUpdate: update,
      receivedAt: new Date()
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        area: "telegram-webhook",
      },
      extra: {
        botId,
      },
    });

    logError("webhook_failed", {
      botId,
      error: error instanceof Error ? error.message : "Unknown error",
      route: "telegram-webhook"
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
