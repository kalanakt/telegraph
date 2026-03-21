import { timingSafeEqual } from 'node:crypto';
export function verifyWebhookSecret(headerValue, expectedSecret) {
    const a = Buffer.from(headerValue);
    const b = Buffer.from(expectedSecret);
    if (a.length !== b.length) {
        return false;
    }
    return timingSafeEqual(a, b);
}
export function telegramApiUrl(token, method) {
    return `https://api.telegram.org/bot${token}/${method}`;
}
//# sourceMappingURL=telegram.js.map