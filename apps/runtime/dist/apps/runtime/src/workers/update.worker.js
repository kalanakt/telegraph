import { rawUpdates } from '@telegraph/db/schema';
import { createLogger, createQueue, createWorker, QUEUE_NAMES } from '@telegraph/shared';
import { eq } from 'drizzle-orm';
import { loadPlan } from '../cache/plan-loader.js';
import { getSession } from '../session/manager.js';
import { matchTrigger } from './helpers.js';
const logger = createLogger('update-worker');
export function createUpdateWorker(redis, db) {
    const executeQueue = createQueue(QUEUE_NAMES.EXECUTE, redis);
    const paymentsQueue = createQueue(QUEUE_NAMES.PAYMENTS, redis);
    return createWorker(QUEUE_NAMES.UPDATES, async (job) => {
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
        const update = rawUpdate.updateJson;
        // 2. Load plan
        const cached = await loadPlan(redis, db, botId);
        if (!cached)
            return; // no published plan
        // 3. Parse update type and extract chatId
        let chatId;
        let entryNodeId = null;
        const updateData = {};
        const callbackQuery = update['callback_query'];
        const message = update['message'];
        const preCheckoutQuery = update['pre_checkout_query'];
        if (callbackQuery) {
            const cbMessage = callbackQuery['message'];
            const chat = cbMessage?.['chat'];
            chatId = String(chat?.['id'] ?? '');
            const token = callbackQuery['data'];
            if (token) {
                const mapping = cached.callbackMap[token];
                if (mapping)
                    entryNodeId = mapping.nodeId;
                updateData['callbackData'] = token;
            }
        }
        else if (preCheckoutQuery) {
            // Payment fast lane: enqueue to payments queue
            await paymentsQueue.add('payment', { botId, update, type: 'pre_checkout' });
            return;
        }
        else if (message) {
            const successfulPayment = message['successful_payment'];
            if (successfulPayment) {
                const chat = message['chat'];
                chatId = String(chat?.['id'] ?? '');
                await paymentsQueue.add('payment', {
                    botId,
                    chatId,
                    update,
                    type: 'successful_payment',
                });
                return;
            }
            const text = message['text'];
            if (text) {
                const chat = message['chat'];
                chatId = String(chat?.['id'] ?? '');
                updateData['text'] = text;
                // Check session for waiting_for_input
                const session = await getSession(redis, botId, chatId);
                if (session?.state === 'waiting_for_input' && session.resumeNodeId) {
                    entryNodeId = session.resumeNodeId;
                    updateData['userInput'] = text;
                }
                else {
                    entryNodeId = matchTrigger(cached.plan.triggers, text);
                }
            }
        }
        if (!chatId || !entryNodeId)
            return;
        // 4. Enqueue to execute
        await executeQueue.add('execute', {
            botId,
            chatId,
            planId: cached.plan.id,
            entryNodeId,
            updateData,
        });
    }, redis, { concurrency: 10 });
}
//# sourceMappingURL=update.worker.js.map