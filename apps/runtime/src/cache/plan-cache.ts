import type { CallbackTokenMap, ExecutionPlan } from '@telegraph/schemas';
import type { Redis } from '@telegraph/shared';

export interface CachedPlan {
  plan: ExecutionPlan;
  callbackMap: CallbackTokenMap;
}

const PLAN_TTL = 60; // 60 seconds

function planKey(botId: string): string {
  return `plan:${botId}`;
}

export async function getCachedPlan(redis: Redis, botId: string): Promise<CachedPlan | null> {
  const raw = await redis.get(planKey(botId));
  if (!raw) return null;
  return JSON.parse(raw) as CachedPlan;
}

export async function setCachedPlan(
  redis: Redis,
  botId: string,
  plan: ExecutionPlan,
  callbackMap: CallbackTokenMap,
): Promise<void> {
  const data: CachedPlan = { plan, callbackMap };
  await redis.set(planKey(botId), JSON.stringify(data), 'EX', PLAN_TTL);
}
