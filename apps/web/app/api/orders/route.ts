import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const user = await requireAppUser();
    const url = new URL(req.url);
    const botId = url.searchParams.get("botId");

    const orders = await prisma.commerceOrder.findMany({
      where: {
        bot: { userId: user.id },
        ...(botId ? { botId } : {}),
      },
      include: {
        customerProfile: true,
        session: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
