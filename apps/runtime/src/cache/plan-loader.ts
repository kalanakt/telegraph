import type { CallbackTokenMap } from '@telegraph/schemas';
import { validateExecutionPlan } from '@telegraph/schemas';
import type { Redis } from '@telegraph/shared';
import { createLogger } from '@telegraph/shared';
import { desc, eq } from 'drizzle-orm';

import type { Database } from '@telegraph/db/client';
import { publishedPlans } from '@telegraph/db/schema';

import { type CachedPlan, getCachedPlan, setCachedPlan } from './plan-cache.js';

const logger = createLogger('plan-loader');

export async function loadPlan(
  redis: Redis,
  db: Database,
  botId: string,
): Promise<CachedPlan | null> {
  // 1. Try cache
  const cached = await getCachedPlan(redis, botId);
  if (cached) return cached;

  // 2. Load from DB
  const rows = await db
    .select()
    .from(publishedPlans)
    .where(eq(publishedPlans.botId, botId))
    .orderBy(desc(publishedPlans.version))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // 3. Validate
  const result = validateExecutionPlan(row.planJson);
  if (!result.success) {
    logger.error({ botId, error: result.error }, 'Invalid execution plan in DB');
    return null;
  }

  const plan = result.data;
  const callbackMap = row.callbackMapJson as CallbackTokenMap;

  // 4. Cache and return
  await setCachedPlan(redis, botId, plan, callbackMap);

  return { plan, callbackMap };
}
