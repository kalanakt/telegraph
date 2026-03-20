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

const SESSION_TTL = 86_400; // 24 hours

function sessionKey(botId: string, chatId: string): string {
  return `session:${botId}:${chatId}`;
}

export async function getSession(
  redis: Redis,
  botId: string,
  chatId: string,
): Promise<ChatSession | null> {
  const raw = await redis.get(sessionKey(botId, chatId));
  if (!raw) return null;
  return JSON.parse(raw) as ChatSession;
}

export async function setSession(
  redis: Redis,
  botId: string,
  chatId: string,
  session: ChatSession,
): Promise<void> {
  await redis.set(sessionKey(botId, chatId), JSON.stringify(session), 'EX', SESSION_TTL);
}

export async function deleteSession(redis: Redis, botId: string, chatId: string): Promise<void> {
  await redis.del(sessionKey(botId, chatId));
}
