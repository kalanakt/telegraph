import fp from 'fastify-plugin';
import { createDb, createPool } from '@telegraph/db/client';
export default fp(async function dbPlugin(fastify) {
    const pool = createPool(process.env['DATABASE_URL']);
    const db = createDb(pool);
    fastify.decorate('db', db);
    fastify.decorate('pool', pool);
    fastify.addHook('onClose', async () => {
        await pool.end();
    });
}, { name: 'db' });
//# sourceMappingURL=db.js.map