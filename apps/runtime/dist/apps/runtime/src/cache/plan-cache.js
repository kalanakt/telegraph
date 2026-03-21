const PLAN_TTL = 60; // 60 seconds
function planKey(botId) {
    return `plan:${botId}`;
}
export async function getCachedPlan(redis, botId) {
    const raw = await redis.get(planKey(botId));
    if (!raw)
        return null;
    return JSON.parse(raw);
}
export async function setCachedPlan(redis, botId, plan, callbackMap) {
    const data = { plan, callbackMap };
    await redis.set(planKey(botId), JSON.stringify(data), 'EX', PLAN_TTL);
}
export async function invalidatePlanCache(redis, botId) {
    await redis.del(planKey(botId));
}
//# sourceMappingURL=plan-cache.js.map