import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await requireAppUser();
    const { sessionId } = await context.params;

    const session = await prisma.conversationSession.findFirst({
      where: {
        id: sessionId,
        bot: { userId: user.id },
      },
      include: {
        customerProfile: true,
        commerceOrders: {
          orderBy: { updatedAt: "desc" },
        },
        checkpoints: {
          orderBy: { createdAt: "desc" },
        },
        workflowRuns: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
