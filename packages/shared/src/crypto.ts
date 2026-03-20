import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export interface EncryptedToken {
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encryptBotToken(
  plaintext: string,
  masterKeyBase64: string,
): EncryptedToken {
  const key = Buffer.from(masterKeyBase64, 'base64');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptBotToken(
  ciphertext: string,
  iv: string,
  tag: string,
  masterKeyBase64: string,
): string {
  const key = Buffer.from(masterKeyBase64, 'base64');
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}
