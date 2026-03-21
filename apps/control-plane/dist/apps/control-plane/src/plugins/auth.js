import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
export async function authenticate(request) {
    await request.jwtVerify();
}
export default fp(async function authPlugin(fastify) {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    await fastify.register(fastifyJwt, { secret });
}, { name: 'auth' });
//# sourceMappingURL=auth.js.map