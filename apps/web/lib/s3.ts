import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

const endpoint = process.env.S3_ENDPOINT!;
const bucket = process.env.S3_BUCKET!;
const region = process.env.S3_REGION ?? "auto";

export const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
  },
  forcePathStyle: true
});

function publicBaseUrl(): string {
  const override = process.env.S3_PUBLIC_URL;
  if (override && override.length > 0) {
    return override.replace(/\/$/, "");
  }
  return `${endpoint.replace(/\/$/, "")}/${bucket}`;
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
  const ext = extname(filename) || "";
  const key = `media/${randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read"
    })
  );

  const url = `${publicBaseUrl()}/${key}`;
  return { url, key };
}
