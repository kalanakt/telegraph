import type { Database } from '@telegraph/db/client';
interface CreateBotInput {
    name: string;
    token: string;
    username?: string;
}
interface UpdateBotInput {
    name?: string;
    username?: string;
}
export declare function listBots(db: Database, tenantId: string, limit?: number, offset?: number): Promise<{
    id: string;
    name: string;
    username: string | null;
    status: "active" | "paused" | "deleted";
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function createBot(db: Database, tenantId: string, input: CreateBotInput, masterKey: string): Promise<{
    id: string;
    name: string;
    username: string | null;
    status: "active" | "paused" | "deleted";
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function getBot(db: Database, tenantId: string, botId: string): Promise<{
    id: string;
    name: string;
    username: string | null;
    status: "active" | "paused" | "deleted";
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function updateBot(db: Database, tenantId: string, botId: string, input: UpdateBotInput): Promise<{
    id: string;
    name: string;
    username: string | null;
    status: "active" | "paused" | "deleted";
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteBot(db: Database, tenantId: string, botId: string): Promise<void>;
export declare function registerWebhook(db: Database, tenantId: string, botId: string, masterKey: string, webhookBaseUrl: string): Promise<{
    webhookUrl: string;
}>;
export declare function removeWebhook(db: Database, tenantId: string, botId: string, masterKey: string): Promise<void>;
export {};
//# sourceMappingURL=bot.service.d.ts.map