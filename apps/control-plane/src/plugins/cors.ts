import fastifyCors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export default fp(
  async function corsPlugin(fastify: FastifyInstance) {
    const envOrigin = process.env['CORS_ORIGIN'];
    const origin = envOrigin
      ? envOrigin.split(',').map((o: string) => o.trim())
      : ['http://localhost:5173'];

    await fastify.register(fastifyCors, {
      origin,
      credentials: true,
    });
  },
  { name: 'cors' },
);
