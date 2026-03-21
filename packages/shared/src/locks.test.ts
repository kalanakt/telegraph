import { describe, it, expect, vi } from 'vitest';
import type { Redis } from 'ioredis';
import { acquireLock } from './locks';

const createMockRedis = () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(
      async (
        _key: string,
        val: string,
        _px: string,
        _ttl: number,
        _nx: string,
      ) => {
        if (store.has(_key)) return null;
        store.set(_key, val);
        return 'OK';
      },
    ),
    eval: vi.fn(
      async (
        _script: string,
        _numKeys: number,
        key: string,
        lockValue: string,
      ) => {
        if (store.get(key) === lockValue) {
          store.delete(key);
          return 1;
        }
        return 0;
      },
    ),
  } as unknown as Redis;
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
    const result = await acquireLock(redis, 'test-lock', 5000);

    // Force a failed acquire
    const failed = await acquireLock(redis, 'test-lock', 5000);
    expect(failed.acquired).toBe(false);

    // Release on a non-acquired lock should not throw
    await expect(failed.release()).resolves.toBeUndefined();
  });
});
