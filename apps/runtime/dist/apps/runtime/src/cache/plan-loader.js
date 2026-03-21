import { validateExecutionPlan } from '@telegraph/schemas';
import { createLogger } from '@telegraph/shared';
import { desc, eq } from 'drizzle-orm';
import { publishedPlans } from '@telegraph/db/schema';
import { getCachedPlan, setCachedPlan } from './plan-cache.js';
const logger = createLogger('plan-loader');
export async function loadPlan(redis, db, botId) {
    // 1. Try cache
    const cached = await getCachedPlan(redis, botId);
    if (cached)
        return cached;
    // 2. Load from DB
    const rows = await db
        .select()
        .from(publishedPlans)
        .where(eq(publishedPlans.botId, botId))
        .orderBy(desc(publishedPlans.version))
        .limit(1);
    const row = rows[0];
    if (!row)
        return null;
    // 3. Validate
    const result = validateExecutionPlan(row.planJson);
    if (!result.success) {
        logger.error({ botId, error: result.error }, 'Invalid execution plan in DB');
        return null;
    }
    const plan = result.data;
    const callbackMap = row.callbackMapJson;
    // 4. Cache and return
    await setCachedPlan(redis, botId, plan, callbackMap);
    return { plan, callbackMap };
}
//# sourceMappingURL=plan-loader.js.map