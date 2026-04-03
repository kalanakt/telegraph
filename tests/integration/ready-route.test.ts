import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawMock = vi.fn();
const pingMock = vi.fn();
const areMediaUploadsEnabledMock = vi.fn();
const checkS3ReadinessMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRawMock(...args)
  }
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    ping: (...args: unknown[]) => pingMock(...args)
  })
}));

vi.mock("@/lib/s3", () => ({
  areMediaUploadsEnabled: (...args: unknown[]) => areMediaUploadsEnabledMock(...args),
  checkS3Readiness: (...args: unknown[]) => checkS3ReadinessMock(...args)
}));

import { GET } from "@/app/api/ready/route";

describe("GET /api/ready", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    pingMock.mockReset();
    areMediaUploadsEnabledMock.mockReset();
    checkS3ReadinessMock.mockReset();
  });

  it("reports ok when dependencies are healthy", async () => {
    queryRawMock.mockResolvedValue([{ "?column?": 1 }]);
    pingMock.mockResolvedValue("PONG");
    areMediaUploadsEnabledMock.mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "web",
      checks: {
        database: "ok",
        redis: "ok",
        storage: "skipped"
      }
    });
  });
});
