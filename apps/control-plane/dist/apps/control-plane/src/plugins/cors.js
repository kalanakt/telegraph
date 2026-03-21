import fastifyCors from '@fastify/cors';
import fp from 'fastify-plugin';
export default fp(async function corsPlugin(fastify) {
    const envOrigin = process.env['CORS_ORIGIN'];
    const origin = envOrigin
        ? envOrigin.split(',').map((o) => o.trim())
        : ['http://localhost:5173'];
    await fastify.register(fastifyCors, {
        origin,
        credentials: true,
    });
}, { name: 'cors' });
//# sourceMappingURL=cors.js.map