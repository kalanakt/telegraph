import IORedis from "ioredis";

let cached: IORedis | null = null;

export function getRedis() {
  if (cached) {
    return cached;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required");
  }

  cached = new IORedis(url, {
    maxRetriesPerRequest: null
  });

  return cached;
}
