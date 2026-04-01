import type { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";
import { PageHeading } from "@/components/PageHeading";
import { clerkCheckoutAppearance, clerkPricingAppearance } from "@/lib/clerk-appearance";
import { toAbsoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Pricing | Telegraph",
  description:
    "See Telegraph pricing for Telegram bot automation, visual flow editor access, and team-ready run history.",
  alternates: {
    canonical: toAbsoluteUrl("/pricing"),
  },
  openGraph: {
    title: "Telegraph Pricing",
    description:
      "See Telegraph pricing for Telegram bot automation, visual flow editor access, and team-ready run history.",
    url: toAbsoluteUrl("/pricing"),
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Pricing"
        subtitle="Choose the plan that fits your bots, workflow volume, and team operations."
      />

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
