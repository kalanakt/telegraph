import { Redis } from 'ioredis';
export function createRedisClient(url) {
    return new Redis(url ?? 'redis://localhost:6379', {
        lazyConnect: true,
        maxRetriesPerRequest: null,
    });
}
export { Redis } from 'ioredis';
//# sourceMappingURL=redis.js.map