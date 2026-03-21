import { and, desc, eq } from 'drizzle-orm';
import { flows, publishedPlans } from '@telegraph/db/schema';
import { compile, CompileValidationError } from '@telegraph/flow-compiler';
import { validateFlowGraph } from '@telegraph/schemas';
export async function listFlows(db, tenantId, botId, limit = 50, offset = 0) {
    return db
        .select()
        .from(flows)
        .where(and(eq(flows.botId, botId), eq(flows.tenantId, tenantId)))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(flows.createdAt));
}
export async function createFlow(db, tenantId, botId, input) {
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
export async function getFlow(db, tenantId, flowId) {
    const [flow] = await db
        .select()
        .from(flows)
        .where(and(eq(flows.id, flowId), eq(flows.tenantId, tenantId)))
        .limit(1);
    return flow ?? null;
}
export async function updateFlowGraph(db, tenantId, flowId, graphJson) {
    const [flow] = await db
        .update(flows)
        .set({ graphJson, updatedAt: new Date() })
        .where(and(eq(flows.id, flowId), eq(flows.tenantId, tenantId)))
        .returning();
    if (!flow) {
        throw Object.assign(new Error('Flow not found'), { statusCode: 404 });
    }
    return flow;
}
export async function deleteFlow(db, tenantId, flowId) {
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
export async function publishFlow(db, redis, tenantId, flowId) {
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
    // Validate graph through JSON Schema
    const validationResult = validateFlowGraph(flow.graphJson);
    if (!validationResult.success) {
        throw Object.assign(new Error(`Invalid flow graph: ${validationResult.error}`), { statusCode: 400 });
    }
    const graph = validationResult.data;
    const newVersion = flow.version + 1;
    // Compile — may throw CompileValidationError
    let result;
    try {
        result = compile(flowId, newVersion, graph);
    }
    catch (err) {
        if (err instanceof CompileValidationError) {
            throw Object.assign(new Error(err.message), { statusCode: 400 });
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
//# sourceMappingURL=flow.service.js.map