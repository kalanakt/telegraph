import { NextResponse } from "next/server";
import { createEmptyWorkflowContext, deriveActionsFromFlow, flowDefinitionSchema, getFrontierActions, normalizeTelegramUpdate } from "@telegram-builder/shared";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function POST(req: Request, context: { params: Promise<{ ruleId: string }> }) {
  try {
    const user = await requireAppUser();
    const { ruleId } = await context.params;
    const body = (await req.json()) as {
      event?: unknown;
      telegramUpdate?: unknown;
      runtime?: Record<string, unknown>;
      checkpointNodeId?: string;
    };

    const rule = await prisma.workflowRule.findFirst({
      where: {
        id: ruleId,
        userId: user.id,
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    const flowDefinition = flowDefinitionSchema.parse(rule.flowDefinition);
    const event =
      body.telegramUpdate && typeof body.telegramUpdate === "object"
        ? normalizeTelegramUpdate(body.telegramUpdate as never)
        : (body.event as Parameters<typeof deriveActionsFromFlow>[1]);

    if (!event) {
      return NextResponse.json({ error: "Provide an event or telegramUpdate payload" }, { status: 400 });
    }

    const runtime = createEmptyWorkflowContext(body.runtime);
    const actions = body.checkpointNodeId
      ? getFrontierActions(flowDefinition, body.checkpointNodeId, event, runtime)
      : deriveActionsFromFlow(flowDefinition, event);

    return NextResponse.json({
      actions,
      runtime,
      trigger: event.trigger,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Simulation failed" }, { status: 400 });
  }
}
