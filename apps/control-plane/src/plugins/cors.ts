import fastifyCors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export default fp(
  async function corsPlugin(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
      origin: ['http://localhost:5173'],
      credentials: true,
    });
  },
  { name: 'cors' },
);
