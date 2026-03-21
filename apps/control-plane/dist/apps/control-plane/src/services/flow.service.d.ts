import type { Database } from '@telegraph/db/client';
import type { Redis } from 'ioredis';
interface CreateFlowInput {
    name: string;
    description?: string;
}
export declare function listFlows(db: Database, tenantId: string, botId: string, limit?: number, offset?: number): Promise<{
    name: string;
    version: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    botId: string;
    description: string | null;
    graphJson: unknown;
    isPublished: boolean;
}[]>;
export declare function createFlow(db: Database, tenantId: string, botId: string, input: CreateFlowInput): Promise<{
    name: string;
    version: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    botId: string;
    description: string | null;
    graphJson: unknown;
    isPublished: boolean;
}>;
export declare function getFlow(db: Database, tenantId: string, flowId: string): Promise<{
    name: string;
    version: number;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    botId: string;
    description: string | null;
    graphJson: unknown;
    isPublished: boolean;
} | null>;
export declare function updateFlowGraph(db: Database, tenantId: string, flowId: string, graphJson: unknown): Promise<{
    id: string;
    botId: string;
    tenantId: string;
    name: string;
    description: string | null;
    graphJson: unknown;
    isPublished: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteFlow(db: Database, tenantId: string, flowId: string): Promise<void>;
export declare function publishFlow(db: Database, redis: Redis, tenantId: string, flowId: string): Promise<{
    version: number;
    id: string;
    tenantId: string;
    botId: string;
    flowId: string;
    planJson: unknown;
    callbackMapJson: unknown;
    publishedAt: Date;
} | undefined>;
export {};
//# sourceMappingURL=flow.service.d.ts.map