import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

const updateFlowStatusSchema = z.object({
  enabled: z.boolean()
});

export async function PATCH(req: Request, context: { params: Promise<{ ruleId: string }> }) {
  try {
    const user = await requireAppUser();
    const { ruleId } = await context.params;
    const data = updateFlowStatusSchema.parse(await req.json());

    const existing = await prisma.workflowRule.findFirst({
      where: {
        id: ruleId,
        userId: user.id
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    const rule = await prisma.workflowRule.update({
      where: { id: ruleId },
      data: {
        enabled: data.enabled
      }
    });

    return NextResponse.json({ rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
