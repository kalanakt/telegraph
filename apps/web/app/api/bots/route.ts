import { NextResponse } from "next/server";
import { addBotSchema, encrypt, requestTelegram, telegramGetMe } from "@telegram-builder/shared";
import { getWebRuntimeEnv } from "@/lib/env";
import { logInfo } from "@/lib/logger";
import { requireAppUser } from "@/lib/user";
import { assertBotLimit, getUserPlan } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

function serializeBot(bot: {
  telegramBotId: bigint;
  [key: string]: unknown;
}) {
  return {
    ...bot,
    telegramBotId: bot.telegramBotId.toString()
  };
}

export async function GET() {
  try {
    const user = await requireAppUser();

    const bots = await prisma.bot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ bots: bots.map(serializeBot) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    getWebRuntimeEnv();
    const user = await requireAppUser();
    const json = await req.json();
    const data = addBotSchema.parse(json);

    const plan = await getUserPlan(user);
    await assertBotLimit(user.id, plan);

    const me = await telegramGetMe(data.token);
    if (!me.ok || !me.result) {
      return NextResponse.json({ error: "Invalid Telegram bot token" }, { status: 400 });
    }

    const encryptedToken = encrypt(data.token);

    const bot = await prisma.bot.upsert({
      where: {
        userId_telegramBotId: {
          userId: user.id,
          telegramBotId: BigInt(me.result.id)
        }
      },
      create: {
        userId: user.id,
        telegramBotId: BigInt(me.result.id),
        username: me.result.username,
        displayName: me.result.first_name,
        encryptedToken,
        status: "active"
      },
      update: {
        username: me.result.username,
        displayName: me.result.first_name,
        encryptedToken,
        status: "active"
      }
    });

    const webhookBase = process.env.TELEGRAM_WEBHOOK_BASE_URL;
    if (!webhookBase) {
      return NextResponse.json({ error: "TELEGRAM_WEBHOOK_BASE_URL is required" }, { status: 500 });
    }

    const webhookUrl = `${webhookBase}/${bot.id}`;
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
    const webhookResult = await requestTelegram(data.token, "setWebhook", {
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
      await prisma.bot.update({ where: { id: bot.id }, data: { status: "webhook_error" } });
      return NextResponse.json(
        {
          error: webhookResult.description ?? "Webhook setup failed",
          details: {
            code: webhookResult.errorCode,
            webhookUrl
          }
        },
        { status: 502 }
      );
    }

    logInfo("bot_connected", {
      botId: bot.id,
      route: "create-bot",
      telegramBotId: me.result.id
    });

    return NextResponse.json({ bot: serializeBot(bot) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add bot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
