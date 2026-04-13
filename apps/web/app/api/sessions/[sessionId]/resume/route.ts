import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function POST(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await requireAppUser();
    const { sessionId } = await context.params;

    const session = await prisma.conversationSession.findFirst({
      where: { id: sessionId, bot: { userId: user.id } },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await prisma.conversationSession.update({
      where: { id: session.id },
      data: {
        status: "ACTIVE",
        handoffOwner: null,
        handoffNote: null,
      },
    });

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json({ error: "Resume failed" }, { status: 400 });
  }
}
