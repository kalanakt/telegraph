export function buildIdempotencyKey(botId: string, updateId: number): string {
  return `${botId}:${updateId}`;
}
