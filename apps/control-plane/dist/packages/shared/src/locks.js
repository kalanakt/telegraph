import { nanoid } from 'nanoid';
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;
export async function acquireLock(redis, key, ttlMs) {
    const lockValue = nanoid();
    const result = await redis.set(key, lockValue, 'PX', ttlMs, 'NX');
    if (result !== 'OK') {
        return { acquired: false, release: async () => { } };
    }
    return {
        acquired: true,
        release: async () => {
            await redis.eval(RELEASE_SCRIPT, 1, key, lockValue);
        },
    };
}
//# sourceMappingURL=locks.js.map