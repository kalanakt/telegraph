import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function DELETE(_: Request, context: { params: Promise<{ ruleId: string }> }) {
  try {
    const user = await requireAppUser();
    const { ruleId } = await context.params;

    const existing = await prisma.workflowRule.findFirst({
      where: {
        id: ruleId,
        userId: user.id
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    await prisma.workflowRule.delete({
      where: { id: ruleId }
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to delete flow" }, { status: 400 });
  }
}
