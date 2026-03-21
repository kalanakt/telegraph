import type { Database } from '@telegraph/db/client';
import type { PlanNode } from '@telegraph/schemas';
import type { Redis } from '@telegraph/shared';
import {
  acquireLock,
  createLogger,
  createQueue,
  createWorker,
  QUEUE_NAMES,
} from '@telegraph/shared';
import type { Worker } from 'bullmq';

import { loadPlan } from '../cache/plan-loader.js';
import type { RuntimeConfig } from '../config.js';
import { getSession, setSession } from '../session/manager.js';
import { evaluateCondition, evaluateExpression, renderTemplate } from './helpers.js';
import { validateUrl } from './url-validator.js';

const logger = createLogger('execute-worker');

const MEDIA_METHOD_MAP: Record<string, string> = {
  photo: 'sendPhoto',
  video: 'sendVideo',
  document: 'sendDocument',
  audio: 'sendAudio',
};

interface ExecuteJobData {
  botId: string;
  chatId: string;
  planId: string;
  entryNodeId: string;
  updateData: Record<string, unknown>;
}

const MAX_STEPS = 50;

export function createExecuteWorker(
  redis: Redis,
  db: Database,
  _config: RuntimeConfig,
): Worker<ExecuteJobData> {
  const outboundQueue = createQueue(QUEUE_NAMES.OUTBOUND, redis);
  const aiQueue = createQueue(QUEUE_NAMES.AI, redis);

  return createWorker<ExecuteJobData>(
    QUEUE_NAMES.EXECUTE,
    async (job) => {
      const { botId, chatId, planId, entryNodeId, updateData } = job.data;

      // 1. Acquire distributed lock
      const lock = await acquireLock(redis, `lock:session:${botId}:${chatId}`, 10_000);
      if (!lock.acquired) {
        throw new Error('Could not acquire session lock');
      }

      try {
        // 2. Load or create session
        let session = await getSession(redis, botId, chatId);
        if (!session) {
          session = {
            botId,
            chatId,
            planId,
            planVersion: 0,
            state: 'executing',
            currentNodeId: null,
            resumeNodeId: null,
            variables: {},
            lastUpdated: new Date().toISOString(),
          };
        }

        // Store incoming data in variables
        if (updateData['userInput'] !== undefined) {
          session.variables['_lastInput'] = updateData['userInput'];
          // Copy user input to the named variable set by wait_for_input
          const waitVar = session.variables['_waitVariable'] as string | undefined;
          if (waitVar) {
            session.variables[waitVar] = updateData['userInput'];
            delete session.variables['_waitVariable'];
            delete session.variables['_lastInput'];
          }
        }
        if (updateData['callbackData'] !== undefined) {
          session.variables['_callbackData'] = updateData['callbackData'];
        }
        if (updateData['text'] !== undefined) {
          session.variables['_text'] = updateData['text'];
        }
        session.state = 'executing';

        // 3. Load plan
        const cached = await loadPlan(redis, db, botId);
        if (!cached) return;

        // 4. Walk plan from entryNodeId
        let currentNodeId: string | null = entryNodeId;
        let steps = 0;

        while (currentNodeId && steps < MAX_STEPS) {
          steps++;
          const node: PlanNode | undefined = cached.plan.nodes[currentNodeId];
          if (!node) break;

          session.currentNodeId = currentNodeId;

          switch (node.type) {
            case 'send_message': {
              const cfg = node.config as {
                text: string;
                parseMode?: string;
                replyMarkup?: unknown;
              };
              const text = renderTemplate(cfg.text, session.variables);
              await outboundQueue.add('send', {
                botId,
                chatId,
                method: 'sendMessage',
                params: {
                  chat_id: chatId,
                  text,
                  parse_mode: cfg.parseMode,
                  reply_markup: cfg.replyMarkup,
                },
              });
              currentNodeId = node.edges[0]?.targetNodeId ?? null;
              break;
            }

            case 'send_media': {
              const cfg = node.config as {
                mediaType: string;
                url?: string;
                fileId?: string;
                caption?: string;
              };
              const method = MEDIA_METHOD_MAP[cfg.mediaType] ?? 'sendDocument';
              const mediaSource = cfg.url ?? cfg.fileId ?? '';
              await outboundQueue.add('send', {
                botId,
                chatId,
                method,
                params: {
                  chat_id: chatId,
                  [cfg.mediaType]: mediaSource,
                  caption: renderTemplate(cfg.caption ?? '', session.variables),
                },
              });
              currentNodeId = node.edges[0]?.targetNodeId ?? null;
              break;
            }

            case 'http_request': {
              const cfg = node.config as {
                method?: string;
                url: string;
                headers?: Record<string, string>;
                body?: string;
                responseVariable: string;
              };
              const url = renderTemplate(cfg.url, session.variables);
              if (!await validateUrl(url)) {
                logger.warn({ botId, chatId, url }, 'Blocked SSRF attempt');
                session.variables[cfg.responseVariable] = null;
                currentNodeId = node.edges[0]?.targetNodeId ?? null;
                break;
              }
              try {
                const fetchOpts: RequestInit = {
                  method: cfg.method ?? 'GET',
                  signal: AbortSignal.timeout(5000),
                };
                if (cfg.headers) fetchOpts.headers = cfg.headers;
                if (cfg.body) fetchOpts.body = renderTemplate(cfg.body, session.variables);
                const resp = await fetch(url, fetchOpts);
                const data: unknown = await resp.json();
                session.variables[cfg.responseVariable] = data;
              } catch (err) {
                logger.error({ botId, chatId, url, err }, 'HTTP request failed');
                session.variables[cfg.responseVariable] = null;
              }
              currentNodeId = node.edges[0]?.targetNodeId ?? null;
              break;
            }

            case 'ai_prompt': {
              const cfg = node.config as {
                systemPrompt?: string;
                userPromptTemplate: string;
                model?: string;
                responseVariable: string;
              };
              await aiQueue.add('ai', {
                botId,
                chatId,
                planId,
                nodeId: currentNodeId,
                resumeNodeId: node.edges[0]?.targetNodeId ?? null,
                config: cfg,
              });
              session.state = 'waiting_for_ai';
              currentNodeId = null; // stop walking
              break;
            }

            case 'condition': {
              const cfg = node.config as {
                rules: Array<{
                  variable: string;
                  operator: string;
                  value: string;
                  targetEdgeId: string;
                }>;
                defaultEdgeId?: string;
              };
              const matchedEdge = evaluateCondition(
                cfg.rules,
                node.edges,
                session.variables,
                cfg.defaultEdgeId,
              );
              currentNodeId = matchedEdge?.targetNodeId ?? null;
              break;
            }

            case 'set_variable': {
              const cfg = node.config as { variable: string; valueExpression: string };
              session.variables[cfg.variable] = evaluateExpression(
                cfg.valueExpression,
                session.variables,
              );
              currentNodeId = node.edges[0]?.targetNodeId ?? null;
              break;
            }

            case 'wait_for_input': {
              const cfg = node.config as { variable: string; timeoutSecs?: number };
              session.state = 'waiting_for_input';
              session.resumeNodeId = node.edges[0]?.targetNodeId ?? null;
              // Store the variable name so we know where to put user input
              session.variables['_waitVariable'] = cfg.variable;
              currentNodeId = null; // stop walking
              break;
            }

            default:
              currentNodeId = node.edges[0]?.targetNodeId ?? null;
          }
        }

        if (steps >= MAX_STEPS) {
          logger.warn({ botId, chatId, planId }, 'Max execution steps reached');
        }

        // 5. Finalize session
        if (session.state === 'executing') session.state = 'idle';
        session.lastUpdated = new Date().toISOString();
        await setSession(redis, botId, chatId, session);
      } finally {
        await lock.release();
      }
    },
    redis,
    { concurrency: 5 },
  );
}
