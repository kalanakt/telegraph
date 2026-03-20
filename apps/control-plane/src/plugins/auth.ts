import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; tenantId: string; role: string };
    user: { userId: string; tenantId: string; role: string };
  }
}

export async function authenticate(request: FastifyRequest) {
  await request.jwtVerify();
}

export default fp(
  async function authPlugin(fastify: FastifyInstance) {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    await fastify.register(fastifyJwt, { secret });
  },
  { name: 'auth' },
);
