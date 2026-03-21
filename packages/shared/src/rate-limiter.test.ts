import { describe, it, expect, vi } from 'vitest';
import type { Redis } from 'ioredis';
import { TokenBucketLimiter } from './rate-limiter.js';

describe('TokenBucketLimiter', () => {
  it('allows within budget', async () => {
    const redis = {
      eval: vi.fn().mockResolvedValue([1, 0]),
    } as unknown as Redis;

    const limiter = new TokenBucketLimiter(redis, 'rl', 10, 1);
    const result = await limiter.consume('user1');

    expect(result).toEqual({ allowed: true });
  });

  it('rejects over budget', async () => {
    const redis = {
      eval: vi.fn().mockResolvedValue([0, 500]),
    } as unknown as Redis;

    const limiter = new TokenBucketLimiter(redis, 'rl', 10, 1);
    const result = await limiter.consume('user1');

    expect(result).toEqual({ allowed: false, retryAfterMs: 500 });
  });

  it('constructs correct key', async () => {
    const redis = {
      eval: vi.fn().mockResolvedValue([1, 0]),
    } as unknown as Redis;

    const limiter = new TokenBucketLimiter(redis, 'myprefix', 10, 1);
    await limiter.consume('somekey');

    // The 3rd argument (index 2) to eval should be the full key
    expect(redis.eval).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(redis.eval).mock.calls[0];
    expect(callArgs![2]).toBe('myprefix:somekey');
  });
});
