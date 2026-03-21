import type { Redis } from 'ioredis';
export interface RateLimitResult {
    allowed: boolean;
    retryAfterMs?: number;
}
export declare class TokenBucketLimiter {
    private redis;
    private keyPrefix;
    private maxTokens;
    private refillRate;
    constructor(redis: Redis, keyPrefix: string, maxTokens: number, refillRate: number);
    consume(key: string, tokens?: number): Promise<RateLimitResult>;
}
//# sourceMappingURL=rate-limiter.d.ts.map