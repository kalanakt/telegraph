import { lt } from 'drizzle-orm';
import { rawUpdates } from './schema.js';
export async function cleanupOldUpdates(db, retentionDays = 7) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await db.delete(rawUpdates).where(lt(rawUpdates.receivedAt, cutoff));
    return result.rowCount ?? 0;
}
//# sourceMappingURL=cleanup.js.map