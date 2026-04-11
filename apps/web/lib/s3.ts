import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

function isTruthyEnv(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

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

export function areMediaUploadsEnabled() {
  return isTruthyEnv(process.env.ENABLE_MEDIA_UPLOADS);
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

export type MediaLibraryKind = "image" | "video" | "document";

export type MediaLibraryItem = {
  key: string;
  url: string;
  proxyPath: string;
  filename: string;
  contentType: string;
  size: number;
  lastModified: string;
  kind: MediaLibraryKind;
};

function encodePathSegment(segment: string) {
  return encodeURIComponent(segment).replace(/%2F/gi, "/");
}

export function buildMediaProxyPath(key: string) {
  return `/api/media/public/${encodePathSegment(key)}`;
}

function inferContentTypeFromKey(key: string): string {
  const extension = extname(key).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    case ".mpeg":
      return "video/mpeg";
    case ".mov":
      return "video/quicktime";
    case ".webm":
      return "video/webm";
    case ".pdf":
      return "application/pdf";
    case ".zip":
      return "application/zip";
    case ".txt":
      return "text/plain";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    default:
      return "application/octet-stream";
  }
}

function kindFromContentType(contentType: string): MediaLibraryKind {
  if (contentType.startsWith("image/")) {
    return "image";
  }
  if (contentType.startsWith("video/")) {
    return "video";
  }
  return "document";
}

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
  const normalizedContentType = contentType.trim().toLowerCase();
  let ext = (extname(filename) || "").toLowerCase();
  if (!ext) {
    const extByMime: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "video/mp4": ".mp4",
      "video/mpeg": ".mpeg",
      "video/quicktime": ".mov",
      "video/webm": ".webm",
      "application/pdf": ".pdf",
      "application/zip": ".zip",
      "application/x-zip-compressed": ".zip",
      "text/plain": ".txt",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx"
    };
    ext = extByMime[normalizedContentType] ?? "";
  }

  const key = `media/${randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: normalizedContentType,
      CacheControl: "public, max-age=31536000, immutable",
      ContentDisposition: "inline",
      Metadata: {
        filename
      },
      ACL: "public-read"
    })
  );

  const url = `${publicBaseUrl()}/${key}`;
  return { url, key };
}

export async function downloadMedia(key: string): Promise<{
  body: unknown;
  contentType?: string;
  contentLength?: number;
}> {
  const config = getS3Config();
  const s3 = getS3Client();

  const result = await s3.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key
    })
  );

  return {
    body: result.Body,
    contentType: result.ContentType,
    contentLength: result.ContentLength
  };
}

export async function listMediaLibrary(options?: {
  limit?: number;
  kind?: MediaLibraryKind;
}): Promise<MediaLibraryItem[]> {
  if (!areMediaUploadsEnabled()) {
    return [];
  }

  const config = getS3Config();
  const s3 = getS3Client();
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 200);
  const listed = await s3.send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: "media/",
      MaxKeys: limit,
    })
  );

  const objects = (listed.Contents ?? [])
    .filter((item): item is NonNullable<typeof item> & { Key: string } => Boolean(item?.Key))
    .sort((a, b) => {
      const aTime = a.LastModified ? a.LastModified.getTime() : 0;
      const bTime = b.LastModified ? b.LastModified.getTime() : 0;
      return bTime - aTime;
    });

  const enriched = await Promise.all(
    objects.map(async (item) => {
      let contentType = inferContentTypeFromKey(item.Key);
      let filename = item.Key.split("/").pop() ?? item.Key;

      try {
        const head = await s3.send(
          new HeadObjectCommand({
            Bucket: config.bucket,
            Key: item.Key,
          })
        );

        if (head.ContentType) {
          contentType = head.ContentType;
        }

        const metadataFilename = head.Metadata?.filename?.trim();
        if (metadataFilename) {
          filename = metadataFilename;
        }
      } catch {
        // Keep best-effort fallback data from ListObjects.
      }

      const kind = kindFromContentType(contentType);

      return {
        key: item.Key,
        url: `${publicBaseUrl()}/${item.Key}`,
        proxyPath: buildMediaProxyPath(item.Key),
        filename,
        contentType,
        size: item.Size ?? 0,
        lastModified: (item.LastModified ?? new Date(0)).toISOString(),
        kind,
      } satisfies MediaLibraryItem;
    })
  );

  return enriched.filter((item) => (options?.kind ? item.kind === options.kind : true));
}

export async function checkS3Readiness(): Promise<void> {
  if (!areMediaUploadsEnabled()) {
    return;
  }

  const config = getS3Config();
  const s3 = getS3Client();

  await s3.send(
    new HeadBucketCommand({
      Bucket: config.bucket
    })
  );
}
