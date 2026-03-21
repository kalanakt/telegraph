import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import type { Worker } from 'bullmq';
import type { RuntimeConfig } from '../config.js';
interface ExecuteJobData {
    botId: string;
    chatId: string;
    planId: string;
    entryNodeId: string;
    updateData: Record<string, unknown>;
}
export declare function createExecuteWorker(redis: Redis, db: Database, _config: RuntimeConfig): Worker<ExecuteJobData>;
export {};
//# sourceMappingURL=execute.worker.d.ts.map