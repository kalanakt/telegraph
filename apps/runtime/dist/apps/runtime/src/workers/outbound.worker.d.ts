import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import type { Worker } from 'bullmq';
import type { RuntimeConfig } from '../config.js';
interface OutboundJobData {
    botId: string;
    chatId: string;
    method: string;
    params: Record<string, unknown>;
}
export declare function createOutboundWorker(redis: Redis, db: Database, config: RuntimeConfig): Worker<OutboundJobData>;
export {};
//# sourceMappingURL=outbound.worker.d.ts.map