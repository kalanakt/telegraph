import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import {
  acquireLock,
  type AiJobData,
  createLogger,
  createQueue,
  createWorker,
  QUEUE_NAMES,
} from '@telegraph/shared';
import type { Worker } from 'bullmq';

import type { RuntimeConfig } from '../config.js';
import { getSession, setSession } from '../session/manager.js';
import { renderTemplate } from './helpers.js';
import { instrumentProcessor } from './instrumentation.js';

const logger = createLogger('ai-worker');

export function createAiWorker(
  redis: Redis,
  _db: Database,
  config: RuntimeConfig,
): Worker<AiJobData> {
  return createWorker<AiJobData>(
    QUEUE_NAMES.AI,
    instrumentProcessor(QUEUE_NAMES.AI, logger, async (job) => {
      const { botId, chatId, resumeNodeId, config: nodeConfig } = job.data;

      const lock = await acquireLock(redis, `lock:session:${botId}:${chatId}`, 30_000);
      if (!lock.acquired) {
        throw new Error('Could not acquire session lock');
      }
      try {
        // 1. Load session
        const session = await getSession(redis, botId, chatId);
        if (!session) {
          logger.warn({ botId, chatId }, 'Session not found for AI worker');
          return;
        }

        // 2. Render prompt template
        const prompt = renderTemplate(nodeConfig.userPromptTemplate, session.variables);
        const systemPrompt = nodeConfig.systemPrompt
          ? renderTemplate(nodeConfig.systemPrompt, session.variables)
          : undefined;

        // 3. Call OpenAI-compatible API
        const messages: Array<{ role: string; content: string }> = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(`${config.openaiBaseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: nodeConfig.model ?? 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
          signal: AbortSignal.timeout(30_000),
        });

        const result = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = result.choices?.[0]?.message?.content ?? '';

        // 4. Store response
        session.variables[nodeConfig.responseVariable] = content;
        session.state = 'idle';
        session.lastUpdated = new Date().toISOString();
        await setSession(redis, botId, chatId, session);

        // 5. Resume execution if there's a next node
        if (resumeNodeId) {
          const executeQueue = createQueue(QUEUE_NAMES.EXECUTE, redis);
          await executeQueue.add('execute', {
            botId,
            chatId,
            planId: session.planId,
            entryNodeId: resumeNodeId,
            updateData: {},
          });
        }
      } finally {
        await lock.release();
      }
    }),
    redis,
    { concurrency: 3 },
  );
}
