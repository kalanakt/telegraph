import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

const handoffSchema = z.object({
  owner: z.string().min(1).max(120).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await requireAppUser();
    const { sessionId } = await context.params;
    const payload = handoffSchema.parse(await req.json());

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
        status: "HANDOFF",
        handoffOwner: payload.owner ?? null,
        handoffNote: payload.note ?? null,
        handedOffAt: new Date(),
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Handoff failed" }, { status: 400 });
  }
}
