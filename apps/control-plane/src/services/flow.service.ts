import { and, desc, eq } from 'drizzle-orm';

import type { Database } from '@telegraph/db/client';
import { flows, publishedPlans } from '@telegraph/db/schema';
import { compile, CompileValidationError } from '@telegraph/flow-compiler';
import type { Redis } from 'ioredis';
import { migrateFlowGraph, validateFlowGraph } from '@telegraph/schemas';

interface CreateFlowInput {
  name: string;
  description?: string;
}

function isGraphV2(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    (value as { schemaVersion?: number }).schemaVersion === 2
  );
}

export async function listFlows(db: Database, tenantId: string, botId: string, limit = 50, offset = 0) {
  return db
    .select()
    .from(flows)
    .where(and(eq(flows.botId, botId), eq(flows.tenantId, tenantId)))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(flows.createdAt));
}

export async function createFlow(db: Database, tenantId: string, botId: string, input: CreateFlowInput) {
  const [flow] = await db
    .insert(flows)
    .values({
      botId,
      tenantId,
      name: input.name,
      description: input.description ?? null,
    })
    .returning();

  if (!flow) {
    throw new Error('Failed to create flow');
  }

  return flow;
}

export async function getFlow(db: Database, tenantId: string, flowId: string) {
  const [flow] = await db
    .select()
    .from(flows)
    .where(and(eq(flows.id, flowId), eq(flows.tenantId, tenantId)))
    .limit(1);

  if (!flow || !flow.graphJson) {
    return flow ?? null;
  }

  const migration = migrateFlowGraph(flow.graphJson);
  if (!migration.success) {
    throw Object.assign(new Error(`Flow graph cannot be migrated to v2: ${migration.error}`), {
      statusCode: 400,
    });
  }

  if (!isGraphV2(flow.graphJson)) {
    await db
      .update(flows)
      .set({ graphJson: migration.data, updatedAt: new Date() })
      .where(and(eq(flows.id, flowId), eq(flows.tenantId, tenantId)));
  }

  return {
    ...flow,
    graphJson: migration.data,
  };
}

export async function updateFlowGraph(db: Database, tenantId: string, flowId: string, graph: unknown) {
  const migration = migrateFlowGraph(graph);
  if (!migration.success) {
    throw Object.assign(new Error(`Flow graph cannot be migrated to v2: ${migration.error}`), {
      statusCode: 400,
    });
  }

  const [flow] = await db
    .update(flows)
    .set({ graphJson: migration.data, updatedAt: new Date() })
    .where(and(eq(flows.id, flowId), eq(flows.tenantId, tenantId)))
    .returning();

  if (!flow) {
    throw Object.assign(new Error('Flow not found'), { statusCode: 404 });
  }

  return flow;
}

export async function deleteFlow(db: Database, tenantId: string, flowId: string) {
  await db.transaction(async (tx) => {
    await tx.delete(publishedPlans).where(eq(publishedPlans.flowId, flowId));

    const [flow] = await tx
      .delete(flows)
      .where(and(eq(flows.id, flowId), eq(flows.tenantId, tenantId)))
      .returning();

    if (!flow) {
      throw Object.assign(new Error('Flow not found'), { statusCode: 404 });
    }
  });
}

export async function publishFlow(db: Database, redis: Redis, tenantId: string, flowId: string) {
  // Fetch flow
  const [flow] = await db
    .select()
    .from(flows)
    .where(and(eq(flows.id, flowId), eq(flows.tenantId, tenantId)))
    .limit(1);

  if (!flow) {
    throw Object.assign(new Error('Flow not found'), { statusCode: 404 });
  }

  if (!flow.graphJson) {
    throw Object.assign(new Error('Flow has no graph to publish'), { statusCode: 400 });
  }

  const migration = migrateFlowGraph(flow.graphJson);
  if (!migration.success) {
    throw Object.assign(new Error(`Flow graph cannot be migrated to v2: ${migration.error}`), {
      statusCode: 400,
    });
  }
  if (!isGraphV2(flow.graphJson)) {
    await db
      .update(flows)
      .set({ graphJson: migration.data, updatedAt: new Date() })
      .where(eq(flows.id, flowId));
  }

  const validationResult = validateFlowGraph(migration.data);
  if (!validationResult.success) {
    throw Object.assign(new Error(`Invalid flow graph: ${validationResult.error}`), { statusCode: 400 });
  }

  const graph = validationResult.data;
  const newVersion = flow.version + 1;

  // Compile — may throw CompileValidationError
  let result;
  try {
    result = compile(flowId, newVersion, graph);
  } catch (err) {
    if (err instanceof CompileValidationError) {
      throw Object.assign(new Error(err.message), {
        statusCode: 400,
        diagnostics: err.errors,
      });
    }
    throw err;
  }

  // Insert published plan
  const [plan] = await db
    .insert(publishedPlans)
    .values({
      flowId,
      botId: flow.botId,
      tenantId,
      planJson: result.plan,
      callbackMapJson: result.callbackMap,
      version: newVersion,
    })
    .returning();

  // Update flow version + published status
  await db
    .update(flows)
    .set({
      isPublished: true,
      version: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(flows.id, flowId));

  // Invalidate runtime plan cache so the new version is picked up immediately
  await redis.del(`plan:${flow.botId}`);

  return plan;
}
