import { Queue, Worker } from 'bullmq';
export const QUEUE_NAMES = {
    UPDATES: 'q_updates',
    EXECUTE: 'q_execute',
    OUTBOUND: 'q_outbound',
    PAYMENTS: 'q_payments',
    AI: 'q_ai',
};
export function createQueue(name, connection) {
    return new Queue(name, {
        connection: connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
        },
    });
}
export function createWorker(name, processor, connection, opts) {
    return new Worker(name, processor, {
        connection: connection,
        concurrency: opts?.concurrency ?? 1,
    });
}
//# sourceMappingURL=queues.js.map