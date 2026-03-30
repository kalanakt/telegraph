import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { TelegramUpdate } from "@telegram-builder/shared";
import { logError, logInfo } from "@/lib/logger";
import { getAutomationOrchestrator } from "@/lib/orchestrator/service";

export async function POST(req: Request, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const orchestrator = getAutomationOrchestrator();

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
  if (expectedSecret) {
    const provided = req.headers.get("x-telegram-bot-api-secret-token");
    if (provided !== expectedSecret) {
      logInfo("webhook_unauthorized", { botId });
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const update = (await req.json()) as TelegramUpdate;

    logInfo("webhook_received", {
      botId,
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
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
