import type { CallbackTokenMap, ExecutionPlan } from '@telegraph/schemas';
import type { Redis } from '@telegraph/shared';
export interface CachedPlan {
    plan: ExecutionPlan;
    callbackMap: CallbackTokenMap;
}
export declare function getCachedPlan(redis: Redis, botId: string): Promise<CachedPlan | null>;
export declare function setCachedPlan(redis: Redis, botId: string, plan: ExecutionPlan, callbackMap: CallbackTokenMap): Promise<void>;
export declare function invalidatePlanCache(redis: Redis, botId: string): Promise<void>;
//# sourceMappingURL=plan-cache.d.ts.map