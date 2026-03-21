import { describe, it, expect, vi } from 'vitest';
import { acquireLock } from './locks.js';
const createMockRedis = () => {
    const store = new Map();
    return {
        set: vi.fn(async (_key, val, _px, _ttl, _nx) => {
            if (store.has(_key))
                return null;
            store.set(_key, val);
            return 'OK';
        }),
        eval: vi.fn(async (_script, _numKeys, key, lockValue) => {
            if (store.get(key) === lockValue) {
                store.delete(key);
                return 1;
            }
            return 0;
        }),
    };
};
describe('acquireLock', () => {
    it('acquires lock successfully', async () => {
        const redis = createMockRedis();
        const result = await acquireLock(redis, 'test-lock', 5000);
        expect(result.acquired).toBe(true);
    });
    it('release removes lock, then re-acquire succeeds', async () => {
        const redis = createMockRedis();
        const first = await acquireLock(redis, 'test-lock', 5000);
        expect(first.acquired).toBe(true);
        await first.release();
        const second = await acquireLock(redis, 'test-lock', 5000);
        expect(second.acquired).toBe(true);
    });
    it('double acquire fails', async () => {
        const redis = createMockRedis();
        const first = await acquireLock(redis, 'test-lock', 5000);
        expect(first.acquired).toBe(true);
        const second = await acquireLock(redis, 'test-lock', 5000);
        expect(second.acquired).toBe(false);
    });
    it('release is safe for non-acquired lock', async () => {
        const redis = createMockRedis();
        await acquireLock(redis, 'test-lock', 5000);
        // Force a failed acquire
        const failed = await acquireLock(redis, 'test-lock', 5000);
        expect(failed.acquired).toBe(false);
        // Release on a non-acquired lock should not throw
        await expect(failed.release()).resolves.toBeUndefined();
    });
});
//# sourceMappingURL=locks.test.js.map