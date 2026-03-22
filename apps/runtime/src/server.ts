import { fileURLToPath } from 'node:url';
import { createDb, createPool } from '@telegraph/db/client';
import { createLogger, createRedisClient } from '@telegraph/shared';
import { initTracing } from '@telegraph/telemetry';

import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { startWorkers } from './workers/index.js';

const maybeLoadEnvFile = (
  process as NodeJS.Process & { loadEnvFile?: (path: string) => void }
).loadEnvFile;
maybeLoadEnvFile?.(fileURLToPath(new URL('../.env', import.meta.url)));

const logger = createLogger('runtime');
const config = loadConfig();

// Init telemetry
initTracing('telegraph-runtime');

// Init connections
const pool = createPool(config.databaseUrl);
const db = createDb(pool);
const redis = createRedisClient(config.redisUrl);
await redis.connect();

// Build Fastify app
const app = await buildApp(config, db, redis);

// Start workers if needed
let workers: ReturnType<typeof startWorkers> | undefined;
if (config.runMode === 'worker' || config.runMode === 'all') {
  workers = startWorkers(redis, db, config);
}

// Start server if needed
if (config.runMode === 'server' || config.runMode === 'all') {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  logger.info({ port: config.port, mode: config.runMode }, 'Runtime server started');
}

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    logger.info('Shutting down...');
    if (workers) await Promise.all(workers.map((w) => w.close()));
    await app.close();
    await redis.quit();
    await pool.end();
    process.exit(0);
  });
}
