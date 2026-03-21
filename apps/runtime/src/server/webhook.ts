import type { Database } from '@telegraph/db/client';
import { rawUpdates, webhookConfigs } from '@telegraph/db/schema';
import type { Redis } from '@telegraph/shared';
import { createLogger, createQueue, QUEUE_NAMES, verifyWebhookSecret } from '@telegraph/shared';
import { registry, webhookRequestsTotal } from '@telegraph/telemetry';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

const logger = createLogger('webhook');

export function registerWebhookRoutes(app: FastifyInstance, db: Database, redis: Redis): void {
  const updatesQueue = createQueue(QUEUE_NAMES.UPDATES, redis);

  app.get('/health', async (_request, reply) => {
    await reply.send({ status: 'ok' });
  });

  app.get('/metrics', async (_request, reply) => {
    const metrics = await registry.metrics();
    await reply.type(registry.contentType).send(metrics);
  });

  app.post<{ Params: { botId: string } }>('/webhook/:botId', async (request, reply) => {
    const { botId } = request.params;
    webhookRequestsTotal.inc({ bot_id: botId, status: 'received' });

    try {
      // 1. Look up webhook config
      const configs = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.botId, botId))
        .limit(1);

      const config = configs[0];
      if (!config || !config.isActive) {
        await reply.code(404).send({ error: 'not found' });
        return;
      }

      // 2. Verify secret token
      const headerSecret = request.headers['x-telegram-bot-api-secret-token'];
      if (
        typeof headerSecret !== 'string' ||
        !verifyWebhookSecret(headerSecret, config.secretToken)
      ) {
        webhookRequestsTotal.inc({ bot_id: botId, status: 'unauthorized' });
        await reply.code(401).send({ error: 'unauthorized' });
        return;
      }

      // 3. Parse update
      const update = request.body as Record<string, unknown>;
      const updateId = update['update_id'] as number | undefined;
      if (updateId === undefined) {
        await reply.code(200).send({});
        return;
      }

      // 4. Idempotent insert
      const inserted = await db
        .insert(rawUpdates)
        .values({
          botId,
          telegramUpdateId: BigInt(updateId),
          updateJson: update,
        })
        .onConflictDoNothing({
          target: [rawUpdates.botId, rawUpdates.telegramUpdateId],
        })
        .returning({ id: rawUpdates.id });

      const row = inserted[0];
      if (row) {
        // 5. Enqueue for processing
        await updatesQueue.add('update', {
          botId,
          rawUpdateId: row.id.toString(),
          telegramUpdateId: updateId,
        });
      }

      await reply.code(200).send({});
    } catch (err) {
      logger.error({ botId, err }, 'Webhook processing error');
      webhookRequestsTotal.inc({ bot_id: botId, status: 'error' });
      // Always return 200 to prevent Telegram retries
      await reply.code(200).send({});
    }
  });
}
