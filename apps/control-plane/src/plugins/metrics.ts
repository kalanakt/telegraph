import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { registry } from '@telegraph/telemetry';

export default fp(
  async function metricsPlugin(fastify: FastifyInstance) {
    fastify.get('/metrics', async (_request, reply) => {
      const metrics = await registry.metrics();
      await reply.type(registry.contentType).send(metrics);
    });
  },
  { name: 'metrics' },
);
