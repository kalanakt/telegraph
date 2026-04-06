import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

const updateBotSettingsSchema = z.object({
  captureUsersEnabled: z.boolean(),
});

export async function PATCH(req: Request, context: { params: Promise<{ botId: string }> }) {
  try {
    const user = await requireAppUser();
    const { botId } = await context.params;
    const json = await req.json();
    const data = updateBotSettingsSchema.parse(json);

    const existing = await prisma.bot.findFirst({
      where: {
        id: botId,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: {
        captureUsersEnabled: data.captureUsersEnabled,
      },
    });

    return NextResponse.json({
      bot: {
        id: bot.id,
        captureUsersEnabled: bot.captureUsersEnabled,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update bot settings" }, { status: 400 });
  }
}
