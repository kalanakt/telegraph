import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type pg from 'pg';

import { createDb, createPool, type Database } from '@telegraph/db/client';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
    pool: pg.Pool;
  }
}

export default fp(
  async function dbPlugin(fastify: FastifyInstance) {
    const pool = createPool(process.env['DATABASE_URL']);
    const db = createDb(pool);

    fastify.decorate('db', db);
    fastify.decorate('pool', pool);

    fastify.addHook('onClose', async () => {
      await pool.end();
    });
  },
  { name: 'db' },
);
