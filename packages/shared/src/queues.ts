import { Queue, Worker } from 'bullmq';
import type { ConnectionOptions, Processor } from 'bullmq';
import type { Redis } from 'ioredis';

export const QUEUE_NAMES = {
  UPDATES: 'q_updates',
  EXECUTE: 'q_execute',
  OUTBOUND: 'q_outbound',
  PAYMENTS: 'q_payments',
  AI: 'q_ai',
} as const;

export function createQueue(name: string, connection: Redis): Queue {
  return new Queue(name, {
    connection: connection as unknown as ConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });
}

export function createWorker<T = unknown>(
  name: string,
  processor: Processor<T>,
  connection: Redis,
  opts?: { concurrency?: number },
): Worker<T> {
  return new Worker<T>(name, processor, {
    connection: connection as unknown as ConnectionOptions,
    concurrency: opts?.concurrency ?? 1,
  });
}
