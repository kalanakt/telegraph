import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
export default fp(async function redisPlugin(fastify) {
    const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379');
    fastify.decorate('redis', redis);
    fastify.addHook('onClose', async () => {
        await redis.quit();
    });
}, { name: 'redis' });
//# sourceMappingURL=redis.js.map