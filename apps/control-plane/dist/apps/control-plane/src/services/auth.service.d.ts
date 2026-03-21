import type { FastifyInstance } from 'fastify';
import type { Database } from '@telegraph/db/client';
interface RegisterInput {
    email: string;
    password: string;
    tenantName: string;
    tenantSlug: string;
}
interface LoginInput {
    email: string;
    password: string;
    tenantSlug: string;
}
export declare function register(db: Database, input: RegisterInput): Promise<{
    user: {
        id: string;
        createdAt: Date;
        tenantId: string;
        email: string;
        passwordHash: string;
        role: "owner" | "admin" | "member";
    };
    tenant: {
        name: string;
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare function login(db: Database, input: LoginInput): Promise<{
    user: {
        id: string;
        createdAt: Date;
        tenantId: string;
        email: string;
        passwordHash: string;
        role: "owner" | "admin" | "member";
    };
    tenant: {
        name: string;
        id: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare function signToken(fastify: FastifyInstance, user: {
    id: string;
    tenantId: string;
    role: string;
}): string;
export {};
//# sourceMappingURL=auth.service.d.ts.map