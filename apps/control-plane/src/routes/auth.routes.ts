import type { FastifyInstance } from 'fastify';

import { authenticate } from '../plugins/auth.js';
import { login, register, signToken } from '../services/auth.service.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      email: string;
      password: string;
      tenantName: string;
      tenantSlug: string;
    };
  }>('/register', async (request, reply) => {
    const { email, password, tenantName, tenantSlug } = request.body;

    const { user, tenant } = await register(fastify.db, {
      email,
      password,
      tenantName,
      tenantSlug,
    });

    const token = signToken(fastify, user);

    return reply.code(201).send({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    });
  });

  fastify.post<{
    Body: {
      email: string;
      password: string;
      tenantSlug: string;
    };
  }>('/login', async (request, reply) => {
    const { email, password, tenantSlug } = request.body;

    const { user, tenant } = await login(fastify.db, {
      email,
      password,
      tenantSlug,
    });

    const token = signToken(fastify, user);

    return reply.send({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    });
  });

  fastify.get('/me', { preValidation: [authenticate] }, async (request, reply) => {
    return reply.send({
      userId: request.user.userId,
      tenantId: request.user.tenantId,
      role: request.user.role,
    });
  });
}
