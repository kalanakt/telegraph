import Fastify from 'fastify';
import { registerWebhookRoutes } from './server/webhook.js';
export async function buildApp(config, db, redis) {
    const app = Fastify({ logger: false });
    if (config.runMode === 'server' || config.runMode === 'all') {
        registerWebhookRoutes(app, db, redis);
    }
    return app;
}
//# sourceMappingURL=app.js.map