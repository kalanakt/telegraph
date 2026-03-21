import { createAiWorker } from './ai.worker.js';
import { createExecuteWorker } from './execute.worker.js';
import { createOutboundWorker } from './outbound.worker.js';
import { createPaymentWorker } from './payment.worker.js';
import { createUpdateWorker } from './update.worker.js';
export function startWorkers(redis, db, config) {
    return [
        createUpdateWorker(redis, db),
        createExecuteWorker(redis, db, config),
        createOutboundWorker(redis, db, config),
        createAiWorker(redis, db, config),
        createPaymentWorker(redis, db, config),
    ];
}
//# sourceMappingURL=index.js.map