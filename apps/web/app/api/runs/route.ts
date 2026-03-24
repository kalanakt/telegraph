import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await requireAppUser();
    const url = new URL(req.url);
    const botId = url.searchParams.get("botId");

    const runs = await prisma.workflowRun.findMany({
      where: {
        userId: user.id,
        ...(botId ? { botId } : {})
      },
      include: {
        actionRuns: {
          orderBy: { createdAt: "asc" }
        },
        rule: {
          select: {
            name: true
          }
        },
        bot: {
          select: {
            username: true,
            displayName: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
