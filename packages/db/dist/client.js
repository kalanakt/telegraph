import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
const { Pool } = pg;
export function createPool(url) {
    return new Pool({
        connectionString: url ?? process.env['DATABASE_URL'] ?? 'postgresql://telegraph:telegraph@localhost:5432/telegraph_dev',
        max: 20,
    });
}
export function createDb(pool) {
    return drizzle(pool, { schema });
}
//# sourceMappingURL=client.js.map