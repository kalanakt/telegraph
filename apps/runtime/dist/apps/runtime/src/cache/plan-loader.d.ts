import type { Redis } from '@telegraph/shared';
import type { Database } from '@telegraph/db/client';
import { type CachedPlan } from './plan-cache.js';
export declare function loadPlan(redis: Redis, db: Database, botId: string): Promise<CachedPlan | null>;
//# sourceMappingURL=plan-loader.d.ts.map