import 'dotenv/config';

import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { createDb, createPool } from './client.js';

async function main() {
  const pool = createPool();
  const db = createDb(pool);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations complete.');

  await pool.end();
}

main().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
