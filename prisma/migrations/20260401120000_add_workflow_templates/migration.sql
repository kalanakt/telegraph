CREATE TYPE "TemplateVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "TemplateVisibility" NOT NULL DEFAULT 'PRIVATE',
    "publishedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowTemplateDraftFlow" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "WorkflowTrigger" NOT NULL,
    "flowDefinition" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplateDraftFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowTemplateVersionFlow" (
    "id" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "WorkflowTrigger" NOT NULL,
    "flowDefinition" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTemplateVersionFlow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowTemplate_slug_key" ON "WorkflowTemplate"("slug");
CREATE INDEX "WorkflowTemplate_userId_createdAt_idx" ON "WorkflowTemplate"("userId", "createdAt");
CREATE INDEX "WorkflowTemplate_visibility_updatedAt_idx" ON "WorkflowTemplate"("visibility", "updatedAt");
CREATE INDEX "WorkflowTemplateDraftFlow_templateId_sortOrder_idx" ON "WorkflowTemplateDraftFlow"("templateId", "sortOrder");
CREATE UNIQUE INDEX "WorkflowTemplateVersion_templateId_version_key" ON "WorkflowTemplateVersion"("templateId", "version");
CREATE INDEX "WorkflowTemplateVersion_templateId_createdAt_idx" ON "WorkflowTemplateVersion"("templateId", "createdAt");
CREATE INDEX "WorkflowTemplateVersionFlow_templateVersionId_sortOrder_idx" ON "WorkflowTemplateVersionFlow"("templateVersionId", "sortOrder");

ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowTemplateDraftFlow" ADD CONSTRAINT "WorkflowTemplateDraftFlow_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowTemplateVersion" ADD CONSTRAINT "WorkflowTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowTemplateVersionFlow" ADD CONSTRAINT "WorkflowTemplateVersionFlow_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "WorkflowTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
