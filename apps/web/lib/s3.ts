import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

type S3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: S3Config | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function getS3Config(): S3Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    endpoint: requireEnv("S3_ENDPOINT"),
    bucket: requireEnv("S3_BUCKET"),
    region: (process.env.S3_REGION ?? "auto").trim() || "auto",
    accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    publicUrl: process.env.S3_PUBLIC_URL?.trim() || undefined
  };

  return cachedConfig;
}

function getS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getS3Config();
  cachedClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: true
  });

  return cachedClient;
}

function publicBaseUrl(): string {
  const config = getS3Config();
  const override = config.publicUrl;
  if (override && override.length > 0) {
    return override.replace(/\/$/, "");
  }
  return `${config.endpoint.replace(/\/$/, "")}/${config.bucket}`;
}

// Telegram file size limits when sending by URL
export const MEDIA_LIMITS = {
  image: 10 * 1024 * 1024,  // 10 MB — Telegram photo limit
  video: 50 * 1024 * 1024,  // 50 MB — Telegram video limit
  default: 50 * 1024 * 1024 // 50 MB — Telegram document limit
} as const;

export const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Videos
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/webm",
  // Documents
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

export function maxSizeForMime(mimeType: string): number {
  const category = mimeType.split("/")[0] ?? "";
  if (category === "image") return MEDIA_LIMITS.image;
  if (category === "video") return MEDIA_LIMITS.video;
  return MEDIA_LIMITS.default;
}

export async function uploadMedia(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const config = getS3Config();
  const s3 = getS3Client();
  const ext = extname(filename) || "";
  const key = `media/${randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read"
    })
  );

  const url = `${publicBaseUrl()}/${key}`;
  return { url, key };
}
