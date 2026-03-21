import type { Redis } from '@telegraph/shared';
export interface ChatSession {
    botId: string;
    chatId: string;
    planId: string;
    planVersion: number;
    state: 'idle' | 'executing' | 'waiting_for_input' | 'waiting_for_ai';
    currentNodeId: string | null;
    resumeNodeId: string | null;
    variables: Record<string, unknown>;
    lastUpdated: string;
}
export declare function getSession(redis: Redis, botId: string, chatId: string): Promise<ChatSession | null>;
export declare function setSession(redis: Redis, botId: string, chatId: string, session: ChatSession): Promise<void>;
export declare function deleteSession(redis: Redis, botId: string, chatId: string): Promise<void>;
//# sourceMappingURL=manager.d.ts.map