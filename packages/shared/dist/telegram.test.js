import { describe, it, expect } from 'vitest';
import { verifyWebhookSecret, telegramApiUrl } from './telegram.js';
describe('verifyWebhookSecret', () => {
    it('returns true for matching secrets', () => {
        expect(verifyWebhookSecret('my-secret-value', 'my-secret-value')).toBe(true);
    });
    it('returns false for non-matching secrets', () => {
        expect(verifyWebhookSecret('my-secret-value', 'wrong-secret')).toBe(false);
    });
    it('returns false for different length strings', () => {
        expect(verifyWebhookSecret('short', 'much-longer-secret')).toBe(false);
    });
});
describe('telegramApiUrl', () => {
    it('returns correct URL', () => {
        expect(telegramApiUrl('123:ABC', 'sendMessage')).toBe('https://api.telegram.org/bot123:ABC/sendMessage');
    });
});
//# sourceMappingURL=telegram.test.js.map