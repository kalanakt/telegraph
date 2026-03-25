import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createFlowSchema } from "@telegram-builder/shared";
import { z } from "zod";
import { requireAppUser } from "@/lib/user";
import { assertRuleLimit, getUserPlan } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

function toPrismaJson(value: z.infer<typeof createFlowSchema>["flowDefinition"]) {
  return value as Prisma.InputJsonObject;
}

export async function GET(req: Request) {
  try {
    const user = await requireAppUser();
    const url = new URL(req.url);
    const botId = url.searchParams.get("botId");

    const rules = await prisma.workflowRule.findMany({
      where: {
        userId: user.id,
        ...(botId ? { botId } : {})
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAppUser();
    const json = await req.json();
    const data = createFlowSchema.parse(json);

    const plan = await getUserPlan(user);
    await assertRuleLimit(user.id, data.botId, plan);

    const rule = await prisma.workflowRule.create({
      data: {
        userId: user.id,
        botId: data.botId,
        name: data.name,
        trigger: data.trigger as never,
        flowDefinition: toPrismaJson(data.flowDefinition)
      }
    });

    return NextResponse.json({ rule }, { status: 201 });
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
    const message = error instanceof Error ? error.message : "Failed to create rule";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const updateFlowSchema = z.object({ ruleId: z.string().min(1) }).and(createFlowSchema);

export async function PUT(req: Request) {
  try {
    const user = await requireAppUser();
    const json = await req.json();
    const data = updateFlowSchema.parse(json);

    const existing = await prisma.workflowRule.findFirst({
      where: {
        id: data.ruleId,
        userId: user.id
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    const rule = await prisma.workflowRule.update({
      where: { id: data.ruleId },
      data: {
        botId: data.botId,
        name: data.name,
        trigger: data.trigger as never,
        flowDefinition: toPrismaJson(data.flowDefinition)
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
    const message = error instanceof Error ? error.message : "Failed to update flow";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
