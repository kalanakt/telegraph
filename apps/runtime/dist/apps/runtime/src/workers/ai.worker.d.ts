import type { Database } from '@telegraph/db/client';
import type { Redis } from '@telegraph/shared';
import type { Worker } from 'bullmq';
import type { RuntimeConfig } from '../config.js';
interface AiJobData {
    botId: string;
    chatId: string;
    planId: string;
    nodeId: string;
    resumeNodeId: string | null;
    config: {
        systemPrompt?: string;
        userPromptTemplate: string;
        model?: string;
        responseVariable: string;
    };
}
export declare function createAiWorker(redis: Redis, _db: Database, config: RuntimeConfig): Worker<AiJobData>;
export {};
//# sourceMappingURL=ai.worker.d.ts.map