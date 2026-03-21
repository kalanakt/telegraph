import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import type { Worker } from 'bullmq';
import type { RuntimeConfig } from '../config.js';
interface PaymentJobData {
    botId: string;
    chatId?: string;
    update: Record<string, unknown>;
    type: 'pre_checkout' | 'successful_payment';
}
export declare function createPaymentWorker(redis: Redis, db: Database, config: RuntimeConfig): Worker<PaymentJobData>;
export {};
//# sourceMappingURL=payment.worker.d.ts.map