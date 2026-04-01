import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const findFirstMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/user", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args)
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workflowRule: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      update: (...args: unknown[]) => updateMock(...args)
    }
  }
}));

import { PATCH } from "@/app/api/flows/[ruleId]/status/route";

describe("PATCH /api/flows/[ruleId]/status", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset();
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("updates a user-owned flow enabled flag", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({ id: "rule_1", userId: "user_1", enabled: false });
    updateMock.mockResolvedValue({ id: "rule_1", enabled: true });

    const response = await PATCH(
      new Request("http://localhost/api/flows/rule_1/status", {
        method: "PATCH",
        body: JSON.stringify({ enabled: true })
      }),
      { params: Promise.resolve({ ruleId: "rule_1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "rule_1" },
      data: { enabled: true }
    });
    await expect(response.json()).resolves.toEqual({
      rule: { id: "rule_1", enabled: true }
    });
  });

  it("returns 404 when the flow is not owned by the user", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/flows/rule_2/status", {
        method: "PATCH",
        body: JSON.stringify({ enabled: false })
      }),
      { params: Promise.resolve({ ruleId: "rule_2" }) }
    );

    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "Flow not found" });
  });
});
