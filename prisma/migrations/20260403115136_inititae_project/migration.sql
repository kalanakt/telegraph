-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('active', 'invalid_token', 'webhook_error', 'paused');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('pending', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "TemplateVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creemCustomerId" TEXT,
    "creemSubscriptionId" TEXT,
    "creemProductId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "activeAt" TIMESTAMP(3),
    "pastDueAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramBotId" BIGINT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "encryptedToken" TEXT NOT NULL,
    "status" "BotStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "flowDefinition" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowWebhookEndpoint" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "encryptedSecret" TEXT,
    "signatureHeaderName" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowWebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleCondition" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleAction" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomingEvent" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "updateId" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "trigger" TEXT NOT NULL,
    "eventPayload" JSONB NOT NULL,
    "contextVariables" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionRun" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'pending',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "WorkflowTemplateDraftFlow" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "flowDefinition" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplateDraftFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplateVersionFlow" (
    "id" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "flowDefinition" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTemplateVersionFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_creemCustomerId_key" ON "Subscription"("creemCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_creemSubscriptionId_key" ON "Subscription"("creemSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Bot_userId_telegramBotId_key" ON "Bot"("userId", "telegramBotId");

-- CreateIndex
CREATE INDEX "WorkflowRule_botId_trigger_enabled_idx" ON "WorkflowRule"("botId", "trigger", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "FlowWebhookEndpoint_ruleId_key" ON "FlowWebhookEndpoint"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowWebhookEndpoint_endpointId_key" ON "FlowWebhookEndpoint"("endpointId");

-- CreateIndex
CREATE INDEX "RuleCondition_ruleId_order_idx" ON "RuleCondition"("ruleId", "order");

-- CreateIndex
CREATE INDEX "RuleAction_ruleId_order_idx" ON "RuleAction"("ruleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingEvent_idempotencyKey_key" ON "IncomingEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "IncomingEvent_botId_createdAt_idx" ON "IncomingEvent"("botId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_botId_createdAt_idx" ON "WorkflowRun"("botId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_userId_createdAt_idx" ON "WorkflowRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionRun_workflowRunId_createdAt_idx" ON "ActionRun"("workflowRunId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActionRun_workflowRunId_actionId_key" ON "ActionRun"("workflowRunId", "actionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_slug_key" ON "WorkflowTemplate"("slug");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_userId_createdAt_idx" ON "WorkflowTemplate"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_visibility_updatedAt_idx" ON "WorkflowTemplate"("visibility", "updatedAt");

-- CreateIndex
CREATE INDEX "WorkflowTemplateDraftFlow_templateId_sortOrder_idx" ON "WorkflowTemplateDraftFlow"("templateId", "sortOrder");

-- CreateIndex
CREATE INDEX "WorkflowTemplateVersion_templateId_createdAt_idx" ON "WorkflowTemplateVersion"("templateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplateVersion_templateId_version_key" ON "WorkflowTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "WorkflowTemplateVersionFlow_templateVersionId_sortOrder_idx" ON "WorkflowTemplateVersionFlow"("templateVersionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRule" ADD CONSTRAINT "WorkflowRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRule" ADD CONSTRAINT "WorkflowRule_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowWebhookEndpoint" ADD CONSTRAINT "FlowWebhookEndpoint_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WorkflowRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleCondition" ADD CONSTRAINT "RuleCondition_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WorkflowRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAction" ADD CONSTRAINT "RuleAction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WorkflowRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingEvent" ADD CONSTRAINT "IncomingEvent_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WorkflowRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "IncomingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionRun" ADD CONSTRAINT "ActionRun_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplateDraftFlow" ADD CONSTRAINT "WorkflowTemplateDraftFlow_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplateVersion" ADD CONSTRAINT "WorkflowTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplateVersionFlow" ADD CONSTRAINT "WorkflowTemplateVersionFlow_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "WorkflowTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
