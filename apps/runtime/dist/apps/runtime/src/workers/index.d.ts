import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import type { Worker } from 'bullmq';
import type { RuntimeConfig } from '../config.js';
export declare function startWorkers(redis: Redis, db: Database, config: RuntimeConfig): Worker[];
//# sourceMappingURL=index.d.ts.map