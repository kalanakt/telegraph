-- Switch billing identifiers from Creem to Clerk Billing.

DROP INDEX IF EXISTS "Subscription_creemCustomerId_key";
DROP INDEX IF EXISTS "Subscription_creemSubscriptionId_key";

ALTER TABLE "Subscription"
  DROP COLUMN IF EXISTS "creemCustomerId",
  DROP COLUMN IF EXISTS "creemSubscriptionId",
  DROP COLUMN IF EXISTS "creemProductId",
  ADD COLUMN IF NOT EXISTS "clerkSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "clerkPayerId" TEXT,
  ADD COLUMN IF NOT EXISTS "clerkPlanSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "pastDueAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_clerkSubscriptionId_key" ON "Subscription"("clerkSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_clerkPayerId_key" ON "Subscription"("clerkPayerId");
