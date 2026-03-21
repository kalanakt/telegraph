import type { FastifyInstance, FastifyRequest } from 'fastify';
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            userId: string;
            tenantId: string;
            role: string;
        };
        user: {
            userId: string;
            tenantId: string;
            role: string;
        };
    }
}
export declare function authenticate(request: FastifyRequest): Promise<void>;
declare const _default: (fastify: FastifyInstance) => Promise<void>;
export default _default;
//# sourceMappingURL=auth.d.ts.map