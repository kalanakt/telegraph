import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { areMediaUploadsEnabled, checkS3Readiness } from "@/lib/s3";

async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

async function checkRedis() {
  const redis = getRedis();
  await redis.ping();
}

export async function GET() {
  const checks: Record<string, "ok" | "error" | "skipped"> = {
    database: "ok",
    redis: "ok",
    storage: "skipped"
  };

  try {
    await checkDatabase();
  } catch {
    checks.database = "error";
  }

  try {
    await checkRedis();
  } catch {
    checks.redis = "error";
  }

  try {
    if (areMediaUploadsEnabled()) {
      await checkS3Readiness();
      checks.storage = "ok";
    }
  } catch {
    checks.storage = "error";
  }

  const ok = checks.database === "ok" && checks.redis === "ok" && checks.storage !== "error";

  return NextResponse.json(
    {
      ok,
      service: "web",
      checks
    },
    { status: ok ? 200 : 503 }
  );
}
