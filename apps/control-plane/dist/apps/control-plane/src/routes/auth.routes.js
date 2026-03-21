import { authenticate } from '../plugins/auth.js';
import { login, register, signToken } from '../services/auth.service.js';
import { LoginBody, RegisterBody, parseBody } from './validation.js';
export default async function authRoutes(fastify) {
    fastify.post('/register', {
        config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    }, async (request, reply) => {
        const body = parseBody(RegisterBody, request.body);
        const { user, tenant } = await register(fastify.db, {
            email: body.email,
            password: body.password,
            tenantName: body.tenantName,
            tenantSlug: body.tenantSlug,
        });
        const token = signToken(fastify, user);
        return reply.code(201).send({
            token,
            user: { id: user.id, email: user.email, role: user.role },
            tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        });
    });
    fastify.post('/login', async (request, reply) => {
        const body = parseBody(LoginBody, request.body);
        const { user, tenant } = await login(fastify.db, {
            email: body.email,
            password: body.password,
            tenantSlug: body.tenantSlug,
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
//# sourceMappingURL=auth.routes.js.map