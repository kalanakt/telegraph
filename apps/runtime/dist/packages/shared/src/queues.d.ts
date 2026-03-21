import { Queue, Worker } from 'bullmq';
import type { Processor } from 'bullmq';
import type { Redis } from 'ioredis';
export declare const QUEUE_NAMES: {
    readonly UPDATES: "q_updates";
    readonly EXECUTE: "q_execute";
    readonly OUTBOUND: "q_outbound";
    readonly PAYMENTS: "q_payments";
    readonly AI: "q_ai";
};
export declare function createQueue(name: string, connection: Redis): Queue;
export declare function createWorker<T = unknown>(name: string, processor: Processor<T>, connection: Redis, opts?: {
    concurrency?: number;
}): Worker<T>;
//# sourceMappingURL=queues.d.ts.map