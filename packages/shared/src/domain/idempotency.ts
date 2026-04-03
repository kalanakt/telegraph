export function buildIdempotencyKey(botId: string, eventId: string | number): string {
  return `${botId}:${eventId}`;
}
