import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import Fastify from 'fastify';

import type { RuntimeConfig } from './config.js';
import { registerWebhookRoutes } from './server/webhook.js';

export async function buildApp(config: RuntimeConfig, db: Database, redis: Redis) {
  const app = Fastify({ logger: false });

  if (config.runMode === 'server' || config.runMode === 'all') {
    registerWebhookRoutes(app, db, redis);
  }

  return app;
}
