-- Replace Clerk billing identifiers with Creem billing identifiers.

DROP INDEX IF EXISTS "Subscription_clerkSubscriptionId_key";
DROP INDEX IF EXISTS "Subscription_clerkPayerId_key";

ALTER TABLE "Subscription"
  DROP COLUMN IF EXISTS "clerkSubscriptionId",
  DROP COLUMN IF EXISTS "clerkPayerId",
  DROP COLUMN IF EXISTS "clerkPlanSlug",
  ADD COLUMN IF NOT EXISTS "creemCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "creemSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "creemProductId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_creemCustomerId_key" ON "Subscription"("creemCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_creemSubscriptionId_key" ON "Subscription"("creemSubscriptionId");
