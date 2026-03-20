import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import type { Worker } from 'bullmq';

import type { RuntimeConfig } from '../config.js';
import { createAiWorker } from './ai.worker.js';
import { createExecuteWorker } from './execute.worker.js';
import { createOutboundWorker } from './outbound.worker.js';
import { createPaymentWorker } from './payment.worker.js';
import { createUpdateWorker } from './update.worker.js';

export function startWorkers(redis: Redis, db: Database, config: RuntimeConfig): Worker[] {
  return [
    createUpdateWorker(redis, db),
    createExecuteWorker(redis, db, config),
    createOutboundWorker(redis, db, config),
    createAiWorker(redis, db, config),
    createPaymentWorker(redis, db, config),
  ];
}
