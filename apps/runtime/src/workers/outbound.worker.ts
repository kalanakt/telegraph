import type { Database } from '@telegraph/db/client';
import { bots } from '@telegraph/db/schema';
import type { Redis } from '@telegraph/shared';
import {
  createLogger,
  createWorker,
  decryptBotToken,
  QUEUE_NAMES,
  TokenBucketLimiter,
} from '@telegraph/shared';
import { outboundMessagesTotal, rateLimitHitsTotal } from '@telegraph/telemetry';
import type { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { Api, GrammyError } from 'grammy';

import type { RuntimeConfig } from '../config.js';

const logger = createLogger('outbound-worker');

interface OutboundJobData {
  botId: string;
  chatId: string;
  method: string;
  params: Record<string, unknown>;
}

interface TokenEntry {
  token: string;
  expiresAt: number;
}

export function createOutboundWorker(
  redis: Redis,
  db: Database,
  config: RuntimeConfig,
): Worker<OutboundJobData> {
  const botLimiter = new TokenBucketLimiter(redis, 'rl:bot', 30, 30);
  const chatLimiter = new TokenBucketLimiter(redis, 'rl:chat', 1, 1);
  const tokenCache = new Map<string, TokenEntry>();

  return createWorker<OutboundJobData>(
    QUEUE_NAMES.OUTBOUND,
    async (job) => {
      const { botId, chatId, method, params } = job.data;

      // 1. Rate limit check
      const botResult = await botLimiter.consume(botId);
      if (!botResult.allowed) {
        rateLimitHitsTotal.inc({ bot_id: botId, limiter_type: 'bot' });
        const delay = botResult.retryAfterMs ?? 1000;
        await job.moveToDelayed(Date.now() + delay, job.token);
        return;
      }
      const chatResult = await chatLimiter.consume(`${botId}:${chatId}`);
      if (!chatResult.allowed) {
        rateLimitHitsTotal.inc({ bot_id: botId, limiter_type: 'chat' });
        const delay = chatResult.retryAfterMs ?? 1000;
        await job.moveToDelayed(Date.now() + delay, job.token);
        return;
      }

      // 2. Get decrypted bot token (with cache)
      let tokenEntry = tokenCache.get(botId);
      if (!tokenEntry || tokenEntry.expiresAt < Date.now()) {
        const rows = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
        const bot = rows[0];
        if (!bot) {
          logger.error({ botId }, 'Bot not found');
          return;
        }
        const token = decryptBotToken(
          bot.encryptedToken,
          bot.tokenIv,
          bot.tokenTag,
          config.botTokenMasterKey,
        );
        tokenEntry = { token, expiresAt: Date.now() + 60_000 };
        tokenCache.set(botId, tokenEntry);
      }

      // 3. Send via grammY Api
      const api = new Api(tokenEntry.token);
      try {
        const chatIdStr = String(params['chat_id'] ?? chatId);
        switch (method) {
          case 'sendMessage': {
            const msgOpts: Record<string, unknown> = {};
            if (params['parse_mode']) msgOpts['parse_mode'] = params['parse_mode'];
            if (params['reply_markup']) msgOpts['reply_markup'] = params['reply_markup'];
            await api.sendMessage(chatIdStr, String(params['text'] ?? ''), msgOpts);
            break;
          }
          case 'sendPhoto': {
            const photoOpts: Record<string, unknown> = {};
            if (params['caption']) photoOpts['caption'] = params['caption'];
            await api.sendPhoto(chatIdStr, String(params['photo'] ?? ''), photoOpts);
            break;
          }
          case 'sendVideo': {
            const videoOpts: Record<string, unknown> = {};
            if (params['caption']) videoOpts['caption'] = params['caption'];
            await api.sendVideo(chatIdStr, String(params['video'] ?? ''), videoOpts);
            break;
          }
          case 'sendDocument': {
            const docOpts: Record<string, unknown> = {};
            if (params['caption']) docOpts['caption'] = params['caption'];
            await api.sendDocument(chatIdStr, String(params['document'] ?? ''), docOpts);
            break;
          }
          case 'sendAudio': {
            const audioOpts: Record<string, unknown> = {};
            if (params['caption']) audioOpts['caption'] = params['caption'];
            await api.sendAudio(chatIdStr, String(params['audio'] ?? ''), audioOpts);
            break;
          }
          default:
            logger.warn({ method }, 'Unknown outbound method');
        }
        outboundMessagesTotal.inc({ bot_id: botId, status: 'success' });
      } catch (err: unknown) {
        if (err instanceof GrammyError && err.error_code === 429) {
          const retryAfter = (err.parameters?.retry_after ?? 1) * 1000;
          outboundMessagesTotal.inc({ bot_id: botId, status: 'rate_limited' });
          await job.moveToDelayed(Date.now() + retryAfter, job.token);
          return;
        }
        outboundMessagesTotal.inc({ bot_id: botId, status: 'error' });
        throw err;
      }
    },
    redis,
    { concurrency: 10 },
  );
}
