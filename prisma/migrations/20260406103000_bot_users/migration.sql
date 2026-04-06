ALTER TABLE "Bot"
ADD COLUMN "captureUsersEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "BotUser" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "languageCode" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "interactionCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BotUser_botId_telegramUserId_key" ON "BotUser"("botId", "telegramUserId");
CREATE INDEX "BotUser_botId_lastSeenAt_idx" ON "BotUser"("botId", "lastSeenAt");

ALTER TABLE "BotUser"
ADD CONSTRAINT "BotUser_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
