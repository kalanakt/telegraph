import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decryptBotToken, encryptBotToken } from './crypto.js';

function randomKey(): string {
  return randomBytes(32).toString('base64');
}

describe('crypto', () => {
  it('encrypts and decrypts a bot token round-trip', () => {
    const key = randomKey();
    const token = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

    const encrypted = encryptBotToken(token, key);
    const decrypted = decryptBotToken(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.tag,
      key,
    );

    expect(decrypted).toBe(token);
  });

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const key = randomKey();
    const token = 'test-token';

    const a = encryptBotToken(token, key);
    const b = encryptBotToken(token, key);

    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('fails to decrypt with wrong key', () => {
    const key1 = randomKey();
    const key2 = randomKey();
    const token = 'secret-token';

    const encrypted = encryptBotToken(token, key1);

    expect(() =>
      decryptBotToken(encrypted.ciphertext, encrypted.iv, encrypted.tag, key2),
    ).toThrow();
  });

  it('fails to decrypt with tampered ciphertext', () => {
    const key = randomKey();
    const token = 'secret-token';

    const encrypted = encryptBotToken(token, key);
    const tampered =
      encrypted.ciphertext.slice(0, -2) +
      (encrypted.ciphertext.endsWith('00') ? 'ff' : '00');

    expect(() =>
      decryptBotToken(tampered, encrypted.iv, encrypted.tag, key),
    ).toThrow();
  });

  it('fails to decrypt with tampered tag', () => {
    const key = randomKey();
    const token = 'secret-token';

    const encrypted = encryptBotToken(token, key);
    const tamperedTag =
      encrypted.tag.slice(0, -2) +
      (encrypted.tag.endsWith('00') ? 'ff' : '00');

    expect(() =>
      decryptBotToken(encrypted.ciphertext, encrypted.iv, tamperedTag, key),
    ).toThrow();
  });
});
