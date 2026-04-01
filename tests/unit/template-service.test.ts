import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  getRemainingRuleCapacityMock,
  getUserPlanMock
} = vi.hoisted(() => ({
  prismaMock: {
    workflowTemplate: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    workflowTemplateVersion: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    workflowTemplateVersionFlow: {
      createMany: vi.fn()
    },
    workflowRule: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  },
  getRemainingRuleCapacityMock: vi.fn(),
  getUserPlanMock: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("@/lib/billing", () => ({
  getRemainingRuleCapacity: (...args: unknown[]) => getRemainingRuleCapacityMock(...args),
  getUserPlan: (...args: unknown[]) => getUserPlanMock(...args)
}));

import { installTemplateForUser, publishTemplate } from "@/lib/templates";

function starterFlow(name = "Flow 1") {
  return {
    name,
    trigger: "message_received" as const,
    flowDefinition: {
      nodes: [
        {
          id: "start_1",
          type: "start" as const,
          position: { x: 0, y: 0 },
          data: {}
        }
      ],
      edges: []
    },
    sortOrder: 0
  };
}

describe("template service", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((value) => {
      if (typeof value === "object" && value) {
        Object.values(value).forEach((fn) => {
          if (typeof fn === "function" && "mockReset" in fn) {
            fn.mockReset();
          }
        });
      }
    });
    prismaMock.$transaction.mockReset();
    getRemainingRuleCapacityMock.mockReset();
    getUserPlanMock.mockReset();
  });

  it("publishes a new immutable version from the current draft flows", async () => {
    prismaMock.workflowTemplate.findFirst.mockResolvedValue({
      id: "tpl_1",
      userId: "user_1",
      title: "Support Bundle",
      description: "Helpful flows",
      visibility: "PUBLIC",
      draftFlows: [starterFlow("Welcome flow")],
      versions: [{ version: 1 }]
    });

    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
      callback(prismaMock as unknown as typeof prismaMock)
    );
    prismaMock.workflowTemplateVersion.create.mockResolvedValue({
      id: "ver_2",
      version: 2
    });
    prismaMock.workflowTemplateVersionFlow.createMany.mockResolvedValue({ count: 1 });
    prismaMock.workflowTemplate.update.mockResolvedValue({});

    const result = await publishTemplate("user_1", "tpl_1");

    expect(result).toEqual({ publishedVersionId: "ver_2", version: 2 });
    expect(prismaMock.workflowTemplateVersion.create).toHaveBeenCalledWith({
      data: {
        templateId: "tpl_1",
        version: 2,
        title: "Support Bundle",
        description: "Helpful flows"
      }
    });
    expect(prismaMock.workflowTemplate.update).toHaveBeenCalledWith({
      where: { id: "tpl_1" },
      data: {
        publishedVersionId: "ver_2",
        visibility: "PUBLIC"
      }
    });
  });

  it("blocks install atomically when the template exceeds remaining rule capacity", async () => {
    prismaMock.workflowTemplate.findUnique.mockResolvedValue({
      id: "tpl_1",
      userId: "user_1",
      publishedVersionId: null,
      draftFlows: [starterFlow("Flow A"), { ...starterFlow("Flow B"), sortOrder: 1 }]
    });
    getUserPlanMock.mockResolvedValue("FREE");
    getRemainingRuleCapacityMock.mockResolvedValue(1);

    const result = await installTemplateForUser(
      { id: "user_1", clerkUserId: "clerk_1", subscription: { plan: "FREE", status: "active" } },
      "tpl_1",
      { botId: "bot_1" }
    );

    expect(result).toEqual({
      status: "upgrade_required",
      upgradeRequired: true,
      templateFlowCount: 2,
      remainingRuleCapacity: 1
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("clones template flows into disabled workflow rules when install succeeds", async () => {
    prismaMock.workflowTemplate.findUnique.mockResolvedValue({
      id: "tpl_1",
      userId: "user_1",
      publishedVersionId: null,
      draftFlows: [starterFlow("Flow A"), { ...starterFlow("Flow B"), sortOrder: 1 }]
    });
    getUserPlanMock.mockResolvedValue("PRO");
    getRemainingRuleCapacityMock.mockResolvedValue(10);
    prismaMock.workflowRule.create
      .mockResolvedValueOnce({ id: "rule_1" })
      .mockResolvedValueOnce({ id: "rule_2" });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
      callback(prismaMock as unknown as typeof prismaMock)
    );

    const result = await installTemplateForUser(
      { id: "user_1", clerkUserId: "clerk_1", subscription: { plan: "PRO", status: "active" } },
      "tpl_1",
      { botId: "bot_1" }
    );

    expect(result).toEqual({
      status: "installed",
      upgradeRequired: false,
      templateFlowCount: 2,
      remainingRuleCapacity: 8,
      firstRuleId: "rule_1",
      rulesCreated: 2
    });
    expect(prismaMock.workflowRule.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.workflowRule.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        userId: "user_1",
        botId: "bot_1",
        name: "Flow A",
        enabled: false
      })
    });
  });
});
