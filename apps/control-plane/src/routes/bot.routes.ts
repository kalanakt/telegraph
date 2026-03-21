import type { FastifyInstance } from 'fastify';

import { authenticate } from '../plugins/auth.js';
import { CreateBotBody, RegisterWebhookBody, UpdateBotBody, parseBody } from './validation.js';
import {
  createBot,
  deleteBot,
  getBot,
  listBots,
  registerWebhook,
  removeWebhook,
  updateBot,
} from '../services/bot.service.js';

function getMasterKey(): string {
  const key = process.env['BOT_TOKEN_MASTER_KEY'];
  if (!key) {
    throw new Error('BOT_TOKEN_MASTER_KEY environment variable is required');
  }
  return key;
}

export default async function botRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  fastify.get('/', async (request, reply) => {
    const { limit = '50', offset = '0' } = request.query as Record<string, string>;
    const result = await listBots(
      fastify.db,
      request.user.tenantId,
      Math.min(parseInt(limit), 100),
      parseInt(offset),
    );
    return reply.send(result);
  });

  fastify.post('/', async (request, reply) => {
    const body = parseBody(CreateBotBody, request.body);
    const bot = await createBot(fastify.db, request.user.tenantId, {
      name: body.name,
      token: body.token,
      ...(body.username != null && { username: body.username }),
    }, getMasterKey());
    return reply.code(201).send(bot);
  });

  fastify.get<{ Params: { botId: string } }>('/:botId', async (request, reply) => {
    const bot = await getBot(fastify.db, request.user.tenantId, request.params.botId);
    if (!bot) {
      return reply.notFound('Bot not found');
    }
    return reply.send(bot);
  });

  fastify.patch<{
    Params: { botId: string };
  }>('/:botId', async (request, reply) => {
    const body = parseBody(UpdateBotBody, request.body);
    const bot = await updateBot(fastify.db, request.user.tenantId, request.params.botId, {
      ...(body.name != null && { name: body.name }),
      ...(body.username != null && { username: body.username }),
    });
    return reply.send(bot);
  });

  fastify.delete<{ Params: { botId: string } }>('/:botId', async (request, reply) => {
    await deleteBot(fastify.db, request.user.tenantId, request.params.botId);
    return reply.code(204).send();
  });

  fastify.post<{
    Params: { botId: string };
  }>('/:botId/webhook/register', async (request, reply) => {
    const body = parseBody(RegisterWebhookBody, request.body);
    const result = await registerWebhook(
      fastify.db,
      request.user.tenantId,
      request.params.botId,
      getMasterKey(),
      body.webhookBaseUrl,
    );
    return reply.send(result);
  });

  fastify.post<{ Params: { botId: string } }>('/:botId/webhook/remove', async (request, reply) => {
    await removeWebhook(fastify.db, request.user.tenantId, request.params.botId, getMasterKey());
    return reply.code(204).send();
  });
}
