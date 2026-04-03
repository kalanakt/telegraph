import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const findFirstMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/user", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args)
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workflowRule: {
      delete: (...args: unknown[]) => deleteMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args)
    }
  }
}));

import { DELETE } from "@/app/api/flows/[ruleId]/route";

describe("DELETE /api/flows/[ruleId]", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset();
    findFirstMock.mockReset();
    deleteMock.mockReset();
  });

  it("deletes a user-owned flow", async () => {
    requireAppUserMock.mockResolvedValue({ id: "user_1" });
    findFirstMock.mockResolvedValue({ id: "rule_1", userId: "user_1" });
    deleteMock.mockResolvedValue({ id: "rule_1" });

    const response = await DELETE(new Request("http://localhost/api/flows/rule_1", { method: "DELETE" }), {
      params: Promise.resolve({ ruleId: "rule_1" })
    });

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "rule_1" }
    });
    await expect(response.json()).resolves.toEqual({ deleted: true });
  });
});
