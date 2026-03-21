import pg from 'pg';
import * as schema from './schema.js';
export declare function createPool(url?: string): import("pg").Pool;
export declare function createDb(pool: pg.Pool): import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
};
export type Database = ReturnType<typeof createDb>;
//# sourceMappingURL=client.d.ts.map