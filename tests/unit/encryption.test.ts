import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decrypt, encrypt, isLegacyEncryptedPayload } from "@telegram-builder/shared";

function encryptLegacy(text: string, secret: string) {
  const iv = randomBytes(16);
  const key = createHash("sha256").update(secret).digest();
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

describe("encryption", () => {
  const previousKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "telegraph_test_encryption_key_32_chars";
  });

  afterEach(() => {
    if (previousKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
      return;
    }

    process.env.ENCRYPTION_KEY = previousKey;
  });

  it("encrypts with the versioned GCM format", () => {
    const payload = encrypt("hello");

    expect(payload.startsWith("v2:")).toBe(true);
    expect(isLegacyEncryptedPayload(payload)).toBe(false);
    expect(decrypt(payload)).toBe("hello");
  });

  it("continues to decrypt legacy CBC payloads", () => {
    const legacyPayload = encryptLegacy("hello", process.env.ENCRYPTION_KEY!);

    expect(isLegacyEncryptedPayload(legacyPayload)).toBe(true);
    expect(decrypt(legacyPayload)).toBe("hello");
  });
});
