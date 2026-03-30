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

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(payload: string): string {
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
