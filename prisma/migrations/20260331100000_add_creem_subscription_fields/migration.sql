-- Add Creem subscription identifiers and lifecycle timestamps.
-- This migration is intentionally additive so existing Clerk billing columns (if any)
-- can remain in place without blocking deployments.

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "creemCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "creemSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "creemProductId" TEXT,
  ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_creemCustomerId_key" ON "Subscription"("creemCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_creemSubscriptionId_key" ON "Subscription"("creemSubscriptionId");
