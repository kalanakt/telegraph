import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(
  async function redisPlugin(fastify: FastifyInstance) {
    const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379');
    fastify.decorate('redis', redis);

    fastify.addHook('onClose', async () => {
      await redis.quit();
    });
  },
  { name: 'redis' },
);
