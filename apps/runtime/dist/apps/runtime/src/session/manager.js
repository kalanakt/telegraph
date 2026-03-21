const SESSION_TTL = 86_400; // 24 hours
function sessionKey(botId, chatId) {
    return `session:${botId}:${chatId}`;
}
export async function getSession(redis, botId, chatId) {
    const raw = await redis.get(sessionKey(botId, chatId));
    if (!raw)
        return null;
    return JSON.parse(raw);
}
export async function setSession(redis, botId, chatId, session) {
    await redis.set(sessionKey(botId, chatId), JSON.stringify(session), 'EX', SESSION_TTL);
}
export async function deleteSession(redis, botId, chatId) {
    await redis.del(sessionKey(botId, chatId));
}
//# sourceMappingURL=manager.js.map