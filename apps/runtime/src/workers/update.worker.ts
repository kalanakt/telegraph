import type { Database } from '@telegraph/db/client';
import { rawUpdates } from '@telegraph/db/schema';
import type { Redis } from '@telegraph/shared';
import {
  createLogger,
  createQueue,
  createWorker,
  QUEUE_NAMES,
  type UpdateJobData,
} from '@telegraph/shared';
import type { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';

import { loadPlan } from '../cache/plan-loader.js';
import { getSession } from '../session/manager.js';
import { matchTrigger } from './helpers.js';
import { instrumentProcessor } from './instrumentation.js';

const logger = createLogger('update-worker');

export function createUpdateWorker(redis: Redis, db: Database): Worker<UpdateJobData> {
  const executeQueue = createQueue(QUEUE_NAMES.EXECUTE, redis);
  const paymentsQueue = createQueue(QUEUE_NAMES.PAYMENTS, redis);

  return createWorker<UpdateJobData>(
    QUEUE_NAMES.UPDATES,
    instrumentProcessor(QUEUE_NAMES.UPDATES, logger, async (job) => {
      const { botId, rawUpdateId } = job.data;

      // 1. Load raw update from DB
      const rows = await db
        .select()
        .from(rawUpdates)
        .where(eq(rawUpdates.id, BigInt(rawUpdateId)))
        .limit(1);

      const rawUpdate = rows[0];
      if (!rawUpdate) {
        logger.warn({ rawUpdateId }, 'Raw update not found');
        return;
      }

      const update = rawUpdate.updateJson as Record<string, unknown>;

      // 2. Load plan
      const cached = await loadPlan(redis, db, botId);
      if (!cached) return; // no published plan

      // 3. Parse update type and extract chatId
      let chatId: string | undefined;
      let entryNodeId: string | null = null;
      const updateData: Record<string, unknown> = {};

      const callbackQuery = update['callback_query'] as Record<string, unknown> | undefined;
      const message = update['message'] as Record<string, unknown> | undefined;
      const preCheckoutQuery = update['pre_checkout_query'] as Record<string, unknown> | undefined;

      if (callbackQuery) {
        const cbMessage = callbackQuery['message'] as Record<string, unknown> | undefined;
        const chat = cbMessage?.['chat'] as Record<string, unknown> | undefined;
        chatId = String(chat?.['id'] ?? '');
        const token = callbackQuery['data'] as string | undefined;
        if (token) {
          const mapping = cached.callbackMap[token];
          if (mapping) entryNodeId = mapping.nodeId;
          updateData['callbackData'] = token;
        }
      } else if (preCheckoutQuery) {
        // Payment fast lane: enqueue to payments queue
        await paymentsQueue.add('payment', { botId, update, type: 'pre_checkout' });
        return;
      } else if (message) {
        const successfulPayment = message['successful_payment'] as
          | Record<string, unknown>
          | undefined;
        if (successfulPayment) {
          const chat = message['chat'] as Record<string, unknown> | undefined;
          chatId = String(chat?.['id'] ?? '');
          await paymentsQueue.add('payment', {
            botId,
            chatId,
            update,
            type: 'successful_payment',
          });
          return;
        }

        const text = message['text'] as string | undefined;
        if (text) {
          const chat = message['chat'] as Record<string, unknown> | undefined;
          chatId = String(chat?.['id'] ?? '');
          updateData['text'] = text;

          // Check session for waiting_for_input
          const session = await getSession(redis, botId, chatId);
          if (session?.state === 'waiting_for_input' && session.resumeNodeId) {
            entryNodeId = session.resumeNodeId;
            updateData['userInput'] = text;
          } else {
            entryNodeId = matchTrigger(cached.plan.triggers, text);
          }
        }
      }

      if (!chatId || !entryNodeId) return;

      // 4. Enqueue to execute
      await executeQueue.add('execute', {
        botId,
        chatId,
        planId: cached.plan.id,
        entryNodeId,
        updateData,
      });
    }),
    redis,
    { concurrency: 10 },
  );
}
