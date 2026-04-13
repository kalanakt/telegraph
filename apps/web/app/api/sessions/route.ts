import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const user = await requireAppUser();
    const url = new URL(req.url);
    const botId = url.searchParams.get("botId");

    const sessions = await prisma.conversationSession.findMany({
      where: {
        bot: { userId: user.id },
        ...(botId ? { botId } : {}),
      },
      include: {
        customerProfile: true,
        commerceOrders: {
          orderBy: { updatedAt: "desc" },
          take: 5,
        },
        checkpoints: {
          where: { status: "OPEN" },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
