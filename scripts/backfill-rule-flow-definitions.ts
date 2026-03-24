import { PrismaClient } from "@prisma/client";
import { actionSchema, conditionSchema, type FlowDefinition } from "@telegram-builder/shared";

const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.workflowRule.findMany({
    include: {
      conditions: {
        orderBy: { order: "asc" }
      },
      actions: {
        orderBy: { order: "asc" }
      }
    }
  });

  let updated = 0;
  for (const rule of rules) {
    const nodes: FlowDefinition["nodes"] = [
      {
        id: "start_1",
        type: "start",
        position: { x: 40, y: 160 },
        data: {}
      }
    ];
    const edges: FlowDefinition["edges"] = [];

    let cursorId = "start_1";
    let y = 160;

    for (const condition of rule.conditions) {
      const parsedCondition = conditionSchema.parse(condition.payload);
      const nodeId = `condition_${condition.id}`;
      y += 120;
      nodes.push({
        id: nodeId,
        type: "condition",
        position: { x: 320, y },
        data: parsedCondition
      });

      edges.push({
        id: `edge_${cursorId}_${nodeId}`,
        source: cursorId,
        target: nodeId,
        sourceHandle: cursorId.startsWith("condition_") ? "true" : undefined
      });

      cursorId = nodeId;
    }

    let actionX = 640;
    let hasActions = false;

    for (const action of rule.actions) {
      hasActions = true;
      const parsedAction = actionSchema.parse(action.payload);
      const nodeId = `action_${action.id}`;
      nodes.push({
        id: nodeId,
        type: "action",
        position: { x: actionX, y },
        data: parsedAction
      });

      edges.push({
        id: `edge_${cursorId}_${nodeId}`,
        source: cursorId,
        target: nodeId,
        sourceHandle: cursorId.startsWith("condition_") ? "true" : undefined
      });

      cursorId = nodeId;
      actionX += 260;
    }

    const flowDefinition: FlowDefinition = {
      nodes,
      edges
    };

    await prisma.workflowRule.update({
      where: { id: rule.id },
      data: {
        flowDefinition: flowDefinition as unknown as object,
        enabled: hasActions ? rule.enabled : false
      }
    });

    updated += 1;
  }

  console.log(`Backfilled flowDefinition for ${updated} rules.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
