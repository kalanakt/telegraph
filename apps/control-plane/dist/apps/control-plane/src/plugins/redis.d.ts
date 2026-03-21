import type { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis;
    }
}
declare const _default: (fastify: FastifyInstance) => Promise<void>;
export default _default;
//# sourceMappingURL=redis.d.ts.map