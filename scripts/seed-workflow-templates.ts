import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import { CURATED_WORKFLOW_TEMPLATES, getCuratedWorkflowTemplateSummaries, type CuratedWorkflowTemplate } from "../apps/web/lib/template-library.js";

const TEMPLATE_LIBRARY_USER = {
  clerkUserId: "seed_telegraph_template_library",
  email: "library@telegraph.dev"
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadProjectEnv() {
  const cwd = process.cwd();
  loadEnvFile(resolve(cwd, ".env"));
  loadEnvFile(resolve(cwd, ".env.local"));
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

function formatTriggerLabel(trigger: string) {
  return trigger.replaceAll("_", " ");
}

function printCatalogPreview() {
  console.log("Curated workflow template catalog:");
  for (const template of getCuratedWorkflowTemplateSummaries()) {
    console.log(
      `- ${template.title} (${template.slug}) -> ${template.flowCount} flow${template.flowCount === 1 ? "" : "s"} | ${template.triggers
        .map(formatTriggerLabel)
        .join(", ")}`
    );
  }
}

async function seedTemplate(prisma: PrismaClient, userId: string, template: CuratedWorkflowTemplate) {
  const existing = await prisma.workflowTemplate.findUnique({
    where: { slug: template.slug },
    select: {
      id: true,
      userId: true
    }
  });

  if (existing && existing.userId !== userId) {
    throw new Error(`Cannot seed template '${template.slug}' because that slug is already owned by another user.`);
  }

  if (!existing) {
    const created = await prisma.$transaction(
      async (tx) => {
        const record = await tx.workflowTemplate.create({
          data: {
            userId,
            title: template.title,
            slug: template.slug,
            description: template.description ?? null,
            visibility: "PUBLIC",
            draftFlows: {
              create: template.flows.map((flow, index) => ({
                name: flow.name,
                trigger: flow.trigger,
                flowDefinition: toPrismaJson(flow.flowDefinition),
                sortOrder: index
              }))
            }
          }
        });

        const version = await tx.workflowTemplateVersion.create({
          data: {
            templateId: record.id,
            version: 1,
            title: template.title,
            description: template.description ?? null
          }
        });

        await tx.workflowTemplateVersionFlow.createMany({
          data: template.flows.map((flow, index) => ({
            templateVersionId: version.id,
            name: flow.name,
            trigger: flow.trigger,
            flowDefinition: toPrismaJson(flow.flowDefinition),
            sortOrder: index
          }))
        });

        await tx.workflowTemplate.update({
          where: { id: record.id },
          data: {
            publishedVersionId: version.id,
            visibility: "PUBLIC"
          }
        });

        return record.id;
      },
      { timeout: 20_000 }
    );

    return {
      status: "created" as const,
      templateId: created
    };
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.workflowTemplate.update({
        where: { id: existing.id },
        data: {
          title: template.title,
          description: template.description ?? null,
          visibility: "PUBLIC",
          publishedVersionId: null
        }
      });

      await tx.workflowTemplateDraftFlow.deleteMany({
        where: { templateId: existing.id }
      });

      await tx.workflowTemplateVersion.deleteMany({
        where: { templateId: existing.id }
      });

      await tx.workflowTemplateDraftFlow.createMany({
        data: template.flows.map((flow, index) => ({
          templateId: existing.id,
          name: flow.name,
          trigger: flow.trigger,
          flowDefinition: toPrismaJson(flow.flowDefinition),
          sortOrder: index
        }))
      });

      const version = await tx.workflowTemplateVersion.create({
        data: {
          templateId: existing.id,
          version: 1,
          title: template.title,
          description: template.description ?? null
        }
      });

      await tx.workflowTemplateVersionFlow.createMany({
        data: template.flows.map((flow, index) => ({
          templateVersionId: version.id,
          name: flow.name,
          trigger: flow.trigger,
          flowDefinition: toPrismaJson(flow.flowDefinition),
          sortOrder: index
        }))
      });

      await tx.workflowTemplate.update({
        where: { id: existing.id },
        data: {
          publishedVersionId: version.id,
          visibility: "PUBLIC"
        }
      });
    },
    { timeout: 20_000 }
  );

  return {
    status: "updated" as const,
    templateId: existing.id
  };
}

async function main() {
  printCatalogPreview();

  if (dryRun) {
    console.log("\nDry run only. No database changes were made.");
    return;
  }

  loadProjectEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to your environment or .env before running the seed.");
  }

  const prisma = new PrismaClient();

  try {
    const libraryUser = await prisma.user.upsert({
      where: {
        clerkUserId: TEMPLATE_LIBRARY_USER.clerkUserId
      },
      update: {
        email: TEMPLATE_LIBRARY_USER.email
      },
      create: TEMPLATE_LIBRARY_USER
    });

    const results = [];
    for (const template of CURATED_WORKFLOW_TEMPLATES) {
      const result = await seedTemplate(prisma, libraryUser.id, template);
      results.push({
        title: template.title,
        slug: template.slug,
        flows: template.flows.length,
        status: result.status
      });
    }

    console.log("\nSeeded curated templates:");
    for (const result of results) {
      console.log(`- [${result.status}] ${result.title} (${result.slug}) -> ${result.flows} flow${result.flows === 1 ? "" : "s"}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nTemplate seeding failed: ${message}`);
  process.exitCode = 1;
});
