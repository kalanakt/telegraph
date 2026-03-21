import type { Redis } from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local max_tokens = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call("hmget", key, "tokens", "last_refill")
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

if tokens == nil then
  tokens = max_tokens
  last_refill = now
end

local elapsed = (now - last_refill) / 1000
local refill = elapsed * refill_rate
tokens = math.min(max_tokens, tokens + refill)

if tokens >= requested then
  tokens = tokens - requested
  redis.call("hmset", key, "tokens", tokens, "last_refill", now)
  redis.call("pexpire", key, math.ceil(max_tokens / refill_rate * 1000) + 1000)
  return {1, 0}
else
  local deficit = requested - tokens
  local wait_ms = math.ceil(deficit / refill_rate * 1000)
  redis.call("hmset", key, "tokens", tokens, "last_refill", now)
  redis.call("pexpire", key, math.ceil(max_tokens / refill_rate * 1000) + 1000)
  return {0, wait_ms}
end
`;

export class TokenBucketLimiter {
  constructor(
    private redis: Redis,
    private keyPrefix: string,
    private maxTokens: number,
    private refillRate: number,
  ) {}

  async consume(key: string, tokens = 1): Promise<RateLimitResult> {
    const fullKey = `${this.keyPrefix}:${key}`;
    const now = Date.now();

    const result = (await this.redis.eval(
      TOKEN_BUCKET_SCRIPT,
      1,
      fullKey,
      this.maxTokens,
      this.refillRate,
      now,
      tokens,
    )) as [number, number];

    if (result[0] === 1) {
      return { allowed: true };
    }

    return { allowed: false, retryAfterMs: result[1] };
  }
}
