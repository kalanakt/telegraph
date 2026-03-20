import { timingSafeEqual } from 'node:crypto';

export function verifyWebhookSecret(
  headerValue: string,
  expectedSecret: string,
): boolean {
  const a = Buffer.from(headerValue);
  const b = Buffer.from(expectedSecret);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function telegramApiUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}
