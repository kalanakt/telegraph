import { lt } from 'drizzle-orm';

import { rawUpdates } from './schema.js';
import type { Database } from './client.js';

export async function cleanupOldUpdates(db: Database, retentionDays = 7): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await db.delete(rawUpdates).where(lt(rawUpdates.receivedAt, cutoff));
  return result.rowCount ?? 0;
}
