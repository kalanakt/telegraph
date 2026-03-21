import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import type { Worker } from 'bullmq';
interface UpdateJobData {
    botId: string;
    rawUpdateId: string;
    telegramUpdateId: number;
}
export declare function createUpdateWorker(redis: Redis, db: Database): Worker<UpdateJobData>;
export {};
//# sourceMappingURL=update.worker.d.ts.map