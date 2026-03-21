import type { Redis } from 'ioredis';
export interface LockResult {
    acquired: boolean;
    release: () => Promise<void>;
}
export declare function acquireLock(redis: Redis, key: string, ttlMs: number): Promise<LockResult>;
//# sourceMappingURL=locks.d.ts.map