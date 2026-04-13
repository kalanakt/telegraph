-- CreateEnum
CREATE TYPE "ConversationSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'HANDOFF', 'CLOSED');

-- CreateEnum
CREATE TYPE "SessionCheckpointStatus" AS ENUM ('OPEN', 'RESUMED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CommerceOrderStatus" AS ENUM ('draft', 'awaiting_shipping', 'awaiting_payment', 'paid', 'fulfilled', 'canceled');

-- AlterTable
ALTER TABLE "Bot" ADD COLUMN     "cryptoPayAppId" TEXT,
ADD COLUMN     "cryptoPayAppName" TEXT,
ADD COLUMN     "cryptoPayConnectedAt" TIMESTAMP(3),
ADD COLUMN     "cryptoPayUseTestnet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "encryptedCryptoPayToken" TEXT,
ADD COLUMN     "encryptedCryptoPayWebhookSecret" TEXT;

-- AlterTable
ALTER TABLE "WorkflowRun" ADD COLUMN     "commerceOrderId" TEXT,
ADD COLUMN     "conversationSessionId" TEXT,
ADD COLUMN     "customerProfileId" TEXT,
ADD COLUMN     "resumedFromCheckpointId" TEXT;

-- CreateTable
CREATE TABLE "ConversationSession" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "telegramUserId" BIGINT,
    "customerProfileId" TEXT,
    "status" "ConversationSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "handedOffAt" TIMESTAMP(3),
    "handoffOwner" TEXT,
    "handoffNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCheckpoint" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "workflowRunId" TEXT,
    "ruleId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "checkpointType" TEXT NOT NULL,
    "status" "SessionCheckpointStatus" NOT NULL DEFAULT 'OPEN',
    "resumeKey" TEXT,
    "metadata" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resumeEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "chatId" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "languageCode" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "tags" JSONB NOT NULL,
    "attributes" JSONB NOT NULL,
    "lastInteractionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceOrder" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "sessionId" TEXT,
    "customerProfileId" TEXT,
    "latestWorkflowRunId" TEXT,
    "externalId" TEXT,
    "invoicePayload" TEXT,
    "currency" TEXT,
    "totalAmount" INTEGER,
    "shippingOptionId" TEXT,
    "shippingAddress" JSONB NOT NULL,
    "orderInfo" JSONB NOT NULL,
    "attributes" JSONB NOT NULL,
    "status" "CommerceOrderStatus" NOT NULL DEFAULT 'draft',
    "paidAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationSession_botId_status_lastEventAt_idx" ON "ConversationSession"("botId", "status", "lastEventAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationSession_botId_chatId_telegramUserId_key" ON "ConversationSession"("botId", "chatId", "telegramUserId");

-- CreateIndex
CREATE INDEX "SessionCheckpoint_sessionId_status_createdAt_idx" ON "SessionCheckpoint"("sessionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SessionCheckpoint_ruleId_status_createdAt_idx" ON "SessionCheckpoint"("ruleId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SessionCheckpoint_resumeKey_status_idx" ON "SessionCheckpoint"("resumeKey", "status");

-- CreateIndex
CREATE INDEX "CustomerProfile_botId_updatedAt_idx" ON "CustomerProfile"("botId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_botId_telegramUserId_key" ON "CustomerProfile"("botId", "telegramUserId");

-- CreateIndex
CREATE INDEX "CommerceOrder_botId_status_updatedAt_idx" ON "CommerceOrder"("botId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "CommerceOrder_invoicePayload_idx" ON "CommerceOrder"("invoicePayload");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceOrder_botId_externalId_key" ON "CommerceOrder"("botId", "externalId");

-- CreateIndex
CREATE INDEX "WorkflowRun_conversationSessionId_createdAt_idx" ON "WorkflowRun"("conversationSessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "ConversationSession" ADD CONSTRAINT "ConversationSession_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationSession" ADD CONSTRAINT "ConversationSession_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCheckpoint" ADD CONSTRAINT "SessionCheckpoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConversationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCheckpoint" ADD CONSTRAINT "SessionCheckpoint_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCheckpoint" ADD CONSTRAINT "SessionCheckpoint_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WorkflowRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCheckpoint" ADD CONSTRAINT "SessionCheckpoint_resumeEventId_fkey" FOREIGN KEY ("resumeEventId") REFERENCES "IncomingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrder" ADD CONSTRAINT "CommerceOrder_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrder" ADD CONSTRAINT "CommerceOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConversationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrder" ADD CONSTRAINT "CommerceOrder_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_conversationSessionId_fkey" FOREIGN KEY ("conversationSessionId") REFERENCES "ConversationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_commerceOrderId_fkey" FOREIGN KEY ("commerceOrderId") REFERENCES "CommerceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_resumedFromCheckpointId_fkey" FOREIGN KEY ("resumedFromCheckpointId") REFERENCES "SessionCheckpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

