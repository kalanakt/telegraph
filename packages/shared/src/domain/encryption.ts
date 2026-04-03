import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

let warnedFallback = false;

function getKey(): Buffer {
  const trimmed = (process.env.ENCRYPTION_KEY ?? "").trim();

  if (trimmed.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required and must be at least 32 characters in production");
    }

    if (!warnedFallback) {
      warnedFallback = true;
      console.warn("Using insecure fallback ENCRYPTION_KEY (set ENCRYPTION_KEY to 32+ chars)");
    }
  }

  const keyMaterial = trimmed.length >= 32 ? trimmed : "fallback_change_me";
  return createHash("sha256").update(keyMaterial).digest();
}

export function isLegacyEncryptedPayload(payload: string): boolean {
  return !payload.startsWith("v2:");
}

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v2:${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

export function decrypt(payload: string): string {
  if (payload.startsWith("v2:")) {
    const [, ivHex, dataHex, authTagHex] = payload.split(":");
    if (!ivHex || !dataHex || !authTagHex) {
      throw new Error("Invalid encrypted payload");
    }

    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(dataHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  }

  const [ivHex, dataHex] = payload.split(":");
  if (!ivHex || !dataHex) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
