import { PricingTable } from "@clerk/nextjs";
import { PageHeading } from "@/components/PageHeading";
import { clerkCheckoutAppearance, clerkPricingAppearance } from "@/lib/clerk-appearance";

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Pricing" subtitle="Upgrade or manage your subscription using Clerk Billing." />

      <PricingTable
        for="user"
        appearance={clerkPricingAppearance}
        checkoutProps={{
          appearance: clerkCheckoutAppearance,
        }}
      />
    </div>
  );
}
