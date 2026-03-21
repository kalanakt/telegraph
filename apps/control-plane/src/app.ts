import rateLimit from '@fastify/rate-limit';
import fastifySensible from '@fastify/sensible';
import Fastify from 'fastify';

import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import dbPlugin from './plugins/db.js';
import metricsPlugin from './plugins/metrics.js';
import authRoutes from './routes/auth.routes.js';
import botRoutes from './routes/bot.routes.js';
import flowRoutes from './routes/flow.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  });

  // Core plugins
  await app.register(fastifySensible);
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' });
  await app.register(corsPlugin);
  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(metricsPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(botRoutes, { prefix: '/api/bots' });
  await app.register(flowRoutes, { prefix: '/api/bots/:botId/flows' });

  return app;
}
