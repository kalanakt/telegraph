import type { Metadata } from "next";
import { PageHeading } from "@/components/PageHeading";
import { PricingPanels } from "@/components/billing/BillingPanels";
import { getAuthUserId } from "@/lib/clerk-auth";
import { toAbsoluteUrl } from "@/lib/site-url";
import { requireAppUser } from "@/lib/user";

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

export default async function PricingPage() {
  const authUserId = await getAuthUserId();
  const user = authUserId ? await requireAppUser() : null;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Pricing"
        subtitle="Choose the plan that fits your bots, workflow volume, and team operations."
      />

      <PricingPanels isSignedIn={Boolean(user)} subscription={user?.subscription} />
    </div>
  );
}
