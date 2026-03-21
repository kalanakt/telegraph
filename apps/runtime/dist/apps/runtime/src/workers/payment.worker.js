import { bots } from '@telegraph/db/schema';
import { createLogger, createWorker, decryptBotToken, QUEUE_NAMES } from '@telegraph/shared';
import { eq } from 'drizzle-orm';
import { Api } from 'grammy';
const logger = createLogger('payment-worker');
export function createPaymentWorker(redis, db, config) {
    return createWorker(QUEUE_NAMES.PAYMENTS, async (job) => {
        const { botId, update, type } = job.data;
        // Get bot token
        const rows = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
        const bot = rows[0];
        if (!bot) {
            logger.error({ botId }, 'Bot not found');
            return;
        }
        const token = decryptBotToken(bot.encryptedToken, bot.tokenIv, bot.tokenTag, config.botTokenMasterKey);
        const api = new Api(token);
        if (type === 'pre_checkout') {
            const preCheckoutQuery = update['pre_checkout_query'];
            const queryId = String(preCheckoutQuery?.['id'] ?? '');
            await api.answerPreCheckoutQuery(queryId, true);
            logger.info({ botId, queryId }, 'Answered pre-checkout query');
        }
        else if (type === 'successful_payment') {
            const message = update['message'];
            const payment = message?.['successful_payment'];
            logger.info({
                botId,
                chatId: job.data.chatId,
                amount: payment?.['total_amount'],
                currency: payment?.['currency'],
                invoicePayload: payment?.['invoice_payload'],
            }, 'Successful payment received');
            // Future: persist transaction to DB
        }
    }, redis, { concurrency: 5 });
}
//# sourceMappingURL=payment.worker.js.map