import { NextResponse } from "next/server";
import { addBotSchema, encrypt, telegramGetMe, telegramSetWebhook } from "@telegram-builder/shared";
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

    const webhookOk = await telegramSetWebhook(data.token, `${webhookBase}/${bot.id}`);

    if (!webhookOk) {
      await prisma.bot.update({ where: { id: bot.id }, data: { status: "webhook_error" } });
      return NextResponse.json({ error: "Webhook setup failed" }, { status: 502 });
    }

    return NextResponse.json({ bot: serializeBot(bot) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add bot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
