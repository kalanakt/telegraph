import { Prisma, type User } from "@prisma/client";
import {
  flowDefinitionSchema,
  installTemplateSchema,
  workflowTemplateDraftSchema,
  type TriggerType,
  type WorkflowTemplateDraft
} from "@telegram-builder/shared";
import { getRemainingRuleCapacity, getUserPlan } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

function normalizeDescription(description?: string | null) {
  const value = description?.trim();
  return value ? value : null;
}

function serializePrismaJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrismaJsonValue(item));
  }

  if (typeof value === "object") {
    if ("toJSON" in value && typeof value.toJSON === "function") {
      return serializePrismaJsonValue(value.toJSON());
    }

    const result: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, nested] of Object.entries(value)) {
      if (nested !== undefined) {
        result[key] = serializePrismaJsonValue(nested);
      }
    }

    return result as Prisma.InputJsonObject;
  }

  throw new TypeError("Value cannot be serialized to Prisma JSON");
}

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonObject {
  const serialized = serializePrismaJsonValue(value);
  if (!serialized || Array.isArray(serialized) || typeof serialized !== "object") {
    throw new TypeError("Expected a JSON object");
  }

  return serialized as Prisma.InputJsonObject;
}

function slugify(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "template";
}

async function generateUniqueSlug(title: string, excludeTemplateId?: string) {
  const base = slugify(title);

  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await prisma.workflowTemplate.findFirst({
      where: {
        slug: candidate,
        ...(excludeTemplateId ? { id: { not: excludeTemplateId } } : {})
      },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

function parseFlowDefinition(value: unknown) {
  return flowDefinitionSchema.parse(value);
}

function mapDraftFlow(flow: {
  id: string;
  name: string;
  trigger: TriggerType;
  flowDefinition: unknown;
  sortOrder: number;
}) {
  return {
    id: flow.id,
    name: flow.name,
    trigger: flow.trigger,
    flowDefinition: parseFlowDefinition(flow.flowDefinition),
    sortOrder: flow.sortOrder
  };
}

function buildAuthorLabel(user: { email: string | null }) {
  if (!user.email) {
    return "Telegraph user";
  }

  return user.email;
}

function normalizeTemplateInput(input: WorkflowTemplateDraft) {
  const parsed = workflowTemplateDraftSchema.parse(input);

  return {
    title: parsed.title.trim(),
    description: normalizeDescription(parsed.description),
    visibility: parsed.visibility,
    flows: parsed.flows.map((flow, index) => ({
      id: flow.id,
      name: flow.name.trim(),
      trigger: flow.trigger,
      flowDefinition: flowDefinitionSchema.parse(flow.flowDefinition),
      sortOrder: index
    }))
  };
}

export function createStarterTemplateFlow(name = "Flow 1") {
  return {
    name,
    trigger: "message_received" as const,
    flowDefinition: {
      nodes: [
        {
          id: "start_1",
          type: "start" as const,
          position: { x: 220, y: 180 },
          data: {}
        }
      ],
      edges: []
    }
  };
}

export async function listUserTemplates(userId: string) {
  const templates = await prisma.workflowTemplate.findMany({
    where: { userId },
    include: {
      draftFlows: {
        orderBy: { sortOrder: "asc" }
      },
      versions: {
        orderBy: { version: "desc" },
        select: {
          id: true,
          version: true,
          title: true,
          description: true,
          createdAt: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return templates.map((template) => ({
    id: template.id,
    title: template.title,
    slug: template.slug,
    description: template.description,
    visibility: template.visibility,
    isPublished: Boolean(template.publishedVersionId),
    publishedVersionId: template.publishedVersionId,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    draftFlowCount: template.draftFlows.length,
    versions: template.versions,
    draftFlows: template.draftFlows.map(mapDraftFlow)
  }));
}

export async function getTemplateForUser(userId: string, templateId: string) {
  const template = await prisma.workflowTemplate.findFirst({
    where: {
      id: templateId,
      userId
    },
    include: {
      draftFlows: {
        orderBy: { sortOrder: "asc" }
      },
      versions: {
        orderBy: { version: "desc" },
        include: {
          flows: {
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    }
  });

  if (!template) {
    return null;
  }

  const publishedVersion = template.publishedVersionId
    ? template.versions.find((version) => version.id === template.publishedVersionId) ?? null
    : null;

  return {
    id: template.id,
    title: template.title,
    slug: template.slug,
    description: template.description,
    visibility: template.visibility,
    publishedVersionId: template.publishedVersionId,
    isPublished: Boolean(template.publishedVersionId),
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    draftFlows: template.draftFlows.map(mapDraftFlow),
    versions: template.versions.map((version) => ({
      id: version.id,
      version: version.version,
      title: version.title,
      description: version.description,
      createdAt: version.createdAt,
      flows: version.flows.map((flow) => ({
        id: flow.id,
        name: flow.name,
        trigger: flow.trigger,
        flowDefinition: parseFlowDefinition(flow.flowDefinition),
        sortOrder: flow.sortOrder
      }))
    })),
    publishedVersion: publishedVersion
      ? {
          id: publishedVersion.id,
          version: publishedVersion.version,
          title: publishedVersion.title,
          description: publishedVersion.description,
          createdAt: publishedVersion.createdAt,
          flows: publishedVersion.flows.map((flow) => ({
            id: flow.id,
            name: flow.name,
            trigger: flow.trigger,
            flowDefinition: parseFlowDefinition(flow.flowDefinition),
            sortOrder: flow.sortOrder
          }))
        }
      : null
  };
}

export async function createTemplate(userId: string, input: WorkflowTemplateDraft) {
  const data = normalizeTemplateInput(input);
  const slug = await generateUniqueSlug(data.title);

  const template = await prisma.workflowTemplate.create({
    data: {
      userId,
      title: data.title,
      slug,
      description: data.description,
      visibility: data.visibility,
      draftFlows: {
        create: data.flows.map((flow) => ({
          name: flow.name,
          trigger: flow.trigger as never,
          flowDefinition: toPrismaJson(flow.flowDefinition),
          sortOrder: flow.sortOrder
        }))
      }
    }
  });

  return getTemplateForUser(userId, template.id);
}

export async function updateTemplate(userId: string, templateId: string, input: WorkflowTemplateDraft) {
  const existing = await prisma.workflowTemplate.findFirst({
    where: {
      id: templateId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!existing) {
    return null;
  }

  const data = normalizeTemplateInput(input);

  await prisma.$transaction(async (tx) => {
    await tx.workflowTemplate.update({
      where: { id: templateId },
      data: {
        title: data.title,
        description: data.description,
        visibility: data.visibility
      }
    });

    await tx.workflowTemplateDraftFlow.deleteMany({
      where: { templateId }
    });

    await tx.workflowTemplateDraftFlow.createMany({
      data: data.flows.map((flow) => ({
        templateId,
        name: flow.name,
        trigger: flow.trigger as never,
        flowDefinition: toPrismaJson(flow.flowDefinition),
        sortOrder: flow.sortOrder
      }))
    });
  });

  return getTemplateForUser(userId, templateId);
}

export async function deleteTemplate(userId: string, templateId: string) {
  const existing = await prisma.workflowTemplate.findFirst({
    where: {
      id: templateId,
      userId
    },
    select: { id: true }
  });

  if (!existing) {
    return false;
  }

  await prisma.workflowTemplate.delete({
    where: { id: templateId }
  });

  return true;
}

export async function publishTemplate(userId: string, templateId: string) {
  const template = await prisma.workflowTemplate.findFirst({
    where: {
      id: templateId,
      userId
    },
    include: {
      draftFlows: {
        orderBy: { sortOrder: "asc" }
      },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { version: true }
      }
    }
  });

  if (!template) {
    return null;
  }

  if (template.visibility !== "PUBLIC") {
    throw new Error("Set template visibility to public before publishing.");
  }

  const nextVersion = (template.versions[0]?.version ?? 0) + 1;

  const publishedVersion = await prisma.$transaction(async (tx) => {
    const version = await tx.workflowTemplateVersion.create({
      data: {
        templateId: template.id,
        version: nextVersion,
        title: template.title,
        description: template.description
      }
    });

    await tx.workflowTemplateVersionFlow.createMany({
      data: template.draftFlows.map((flow) => ({
        templateVersionId: version.id,
        name: flow.name,
        trigger: flow.trigger,
        flowDefinition: toPrismaJson(parseFlowDefinition(flow.flowDefinition)),
        sortOrder: flow.sortOrder
      }))
    });

    await tx.workflowTemplate.update({
      where: { id: template.id },
      data: {
        publishedVersionId: version.id,
        visibility: "PUBLIC"
      }
    });

    return version;
  });

  return {
    publishedVersionId: publishedVersion.id,
    version: publishedVersion.version
  };
}

export async function unpublishTemplate(userId: string, templateId: string) {
  const existing = await prisma.workflowTemplate.findFirst({
    where: {
      id: templateId,
      userId
    },
    select: { id: true }
  });

  if (!existing) {
    return false;
  }

  await prisma.workflowTemplate.update({
    where: { id: templateId },
    data: {
      publishedVersionId: null,
      visibility: "PRIVATE"
    }
  });

  return true;
}

export async function listPublicTemplates() {
  const templates = await prisma.workflowTemplate.findMany({
    where: {
      publishedVersionId: {
        not: null
      }
    },
    include: {
      user: {
        select: {
          email: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const versionIds = templates
    .map((template) => template.publishedVersionId)
    .filter((value): value is string => Boolean(value));

  const versions = versionIds.length
    ? await prisma.workflowTemplateVersion.findMany({
        where: {
          id: {
            in: versionIds
          }
        },
        include: {
          flows: {
            orderBy: { sortOrder: "asc" }
          }
        }
      })
    : [];

  const versionMap = new Map(versions.map((version) => [version.id, version]));

  return templates
    .map((template) => {
      const version = template.publishedVersionId
        ? versionMap.get(template.publishedVersionId)
        : null;

      if (!version) {
        return null;
      }

      return {
        id: template.id,
        slug: template.slug,
        title: version.title,
        description: version.description,
        authorLabel: buildAuthorLabel(template.user),
        flowCount: version.flows.length,
        publishedAt: version.createdAt,
        version: version.version
      };
    })
    .filter((template): template is NonNullable<typeof template> => Boolean(template));
}

export async function getPublicTemplateBySlug(slug: string) {
  const template = await prisma.workflowTemplate.findFirst({
    where: {
      slug,
      publishedVersionId: {
        not: null
      }
    },
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });

  if (!template?.publishedVersionId) {
    return null;
  }

  const version = await prisma.workflowTemplateVersion.findUnique({
    where: {
      id: template.publishedVersionId
    },
    include: {
      flows: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!version) {
    return null;
  }

  return {
    id: template.id,
    slug: template.slug,
    title: version.title,
    description: version.description,
    authorLabel: buildAuthorLabel(template.user),
    publishedAt: version.createdAt,
    version: version.version,
    flows: version.flows.map((flow) => ({
      id: flow.id,
      name: flow.name,
      trigger: flow.trigger,
      flowDefinition: parseFlowDefinition(flow.flowDefinition),
      sortOrder: flow.sortOrder
    }))
  };
}

export async function installTemplateForUser(user: Pick<User, "id" | "clerkUserId"> & {
  subscription?: { plan?: string | null; status?: string | null } | null;
}, templateId: string, input: unknown) {
  const data = installTemplateSchema.parse(input);

  const template = await prisma.workflowTemplate.findUnique({
    where: { id: templateId },
    include: {
      draftFlows: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!template) {
    return { status: "not_found" as const };
  }

  const isOwner = template.userId === user.id;
  let sourceFlows:
    | Array<{
        name: string;
        trigger: TriggerType;
        flowDefinition: unknown;
        sortOrder: number;
      }>
    | null = null;

  if (isOwner) {
    sourceFlows = template.draftFlows;
  } else if (template.publishedVersionId) {
    const version = await prisma.workflowTemplateVersion.findUnique({
      where: { id: template.publishedVersionId },
      include: {
        flows: {
          orderBy: { sortOrder: "asc" }
        }
      }
    });
    sourceFlows = version?.flows ?? null;
  }

  if (!sourceFlows) {
    return { status: "forbidden" as const };
  }

  const plan = await getUserPlan(user);
  const remainingRuleCapacity = await getRemainingRuleCapacity(user.id, data.botId, plan);
  const templateFlowCount = sourceFlows.length;

  if (templateFlowCount > remainingRuleCapacity) {
    return {
      status: "upgrade_required" as const,
      upgradeRequired: true,
      templateFlowCount,
      remainingRuleCapacity
    };
  }

  const createdRules = await prisma.$transaction(async (tx) => {
    return Promise.all(
      sourceFlows.map((flow) =>
        tx.workflowRule.create({
          data: {
            userId: user.id,
            botId: data.botId,
            name: flow.name,
            trigger: flow.trigger as never,
            flowDefinition: toPrismaJson(parseFlowDefinition(flow.flowDefinition)),
            enabled: false
          }
        })
      )
    );
  });

  return {
    status: "installed" as const,
    upgradeRequired: false,
    templateFlowCount,
    remainingRuleCapacity: remainingRuleCapacity - templateFlowCount,
    firstRuleId: createdRules[0]?.id ?? null,
    rulesCreated: createdRules.length
  };
}
