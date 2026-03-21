import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import Fastify from 'fastify';
import type { RuntimeConfig } from './config.js';
export declare function buildApp(config: RuntimeConfig, db: Database, redis: Redis): Promise<Fastify.FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, Fastify.FastifyBaseLogger, Fastify.FastifyTypeProviderDefault>>;
//# sourceMappingURL=app.d.ts.map