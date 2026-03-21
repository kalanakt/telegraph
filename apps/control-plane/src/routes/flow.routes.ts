import type { FastifyInstance } from 'fastify';

import { authenticate } from '../plugins/auth.js';
import { getBot } from '../services/bot.service.js';
import { CreateFlowBody, UpdateFlowGraphBody, parseBody } from './validation.js';
import {
  createFlow,
  deleteFlow,
  getFlow,
  listFlows,
  publishFlow,
  updateFlowGraph,
} from '../services/flow.service.js';

export default async function flowRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authenticate);

  // Verify the bot belongs to the tenant before processing flow routes
  fastify.addHook('preHandler', async (request, reply) => {
    const params = request.params as { botId?: string };
    if (params.botId) {
      const bot = await getBot(fastify.db, request.user.tenantId, params.botId);
      if (!bot) {
        return reply.notFound('Bot not found');
      }
    }
  });

  fastify.get<{ Params: { botId: string } }>('/', async (request, reply) => {
    const { limit = '50', offset = '0' } = request.query as Record<string, string>;
    const result = await listFlows(
      fastify.db,
      request.user.tenantId,
      request.params.botId,
      Math.min(parseInt(limit), 100),
      parseInt(offset),
    );
    return reply.send(result);
  });

  fastify.post<{
    Params: { botId: string };
  }>('/', async (request, reply) => {
    const body = parseBody(CreateFlowBody, request.body);
    const flow = await createFlow(fastify.db, request.user.tenantId, request.params.botId, {
      name: body.name,
      ...(body.description != null && { description: body.description }),
    });
    return reply.code(201).send(flow);
  });

  fastify.get<{
    Params: { botId: string; flowId: string };
  }>('/:flowId', async (request, reply) => {
    const flow = await getFlow(fastify.db, request.user.tenantId, request.params.flowId);
    if (!flow) {
      return reply.notFound('Flow not found');
    }
    return reply.send(flow);
  });

  fastify.put<{
    Params: { botId: string; flowId: string };
  }>('/:flowId', async (request, reply) => {
    const body = parseBody(UpdateFlowGraphBody, request.body);
    const flow = await updateFlowGraph(
      fastify.db,
      request.user.tenantId,
      request.params.flowId,
      body.graphJson,
    );
    return reply.send(flow);
  });

  fastify.delete<{
    Params: { botId: string; flowId: string };
  }>('/:flowId', async (request, reply) => {
    await deleteFlow(fastify.db, request.user.tenantId, request.params.flowId);
    return reply.code(204).send();
  });

  fastify.post<{
    Params: { botId: string; flowId: string };
  }>('/:flowId/publish', async (request, reply) => {
    const plan = await publishFlow(fastify.db, fastify.redis, request.user.tenantId, request.params.flowId);
    return reply.send(plan);
  });
}
