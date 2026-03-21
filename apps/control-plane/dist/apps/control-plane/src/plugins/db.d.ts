import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { type Database } from '@telegraph/db/client';
declare module 'fastify' {
    interface FastifyInstance {
        db: Database;
        pool: pg.Pool;
    }
}
declare const _default: (fastify: FastifyInstance) => Promise<void>;
export default _default;
//# sourceMappingURL=db.d.ts.map