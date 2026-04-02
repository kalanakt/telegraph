import { UserProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { BillingOverviewCard } from "@/components/billing/BillingPanels";
import { PageHeading } from "@/components/PageHeading";
import { clerkProfileAppearance } from "@/lib/clerk-appearance";
import {
  getBillingReturnState,
  hasCheckoutReturnParams,
  syncSubscriptionMirrorFromCheckoutReturn
} from "@/lib/creem-billing";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export default async function AccountProfilePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let user;

  try {
    user = await requireAppUser();
  } catch {
    redirect("/sign-in?redirect_url=/account");
  }

  const query = await searchParams;
  const redirectState = getBillingReturnState(query);
  let checkoutReturnNotice: string | null = null;

  if (hasCheckoutReturnParams(query)) {
    const result = await syncSubscriptionMirrorFromCheckoutReturn({
      appUserId: user.id,
      searchParams: query
    });

    if (result.status === "success") {
      checkoutReturnNotice = "Billing was verified and your workspace subscription mirror has been refreshed.";
    } else if (result.status === "invalid_signature") {
      checkoutReturnNotice = "Creem returned to Telegraph, but the redirect signature could not be verified.";
    }
  }

  const freshUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      subscription: {
        select: {
          creemCustomerId: true,
          currentPeriodEnd: true,
          plan: true,
          status: true
        }
      }
    }
  });

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <PageHeading
        title="Account"
        subtitle="Manage your Telegraph billing state and Clerk account settings from one place."
      />

      {redirectState ? (
        <p className="border border-border/80 bg-muted px-4 py-3 text-sm text-muted-foreground">
          {redirectState.message}
        </p>
      ) : null}

      {checkoutReturnNotice ? (
        <p className="border border-border/80 bg-muted px-4 py-3 text-sm text-muted-foreground">
          {checkoutReturnNotice}
        </p>
      ) : null}

      <BillingOverviewCard subscription={freshUser.subscription} />

      <div className="border border-border">
        <UserProfile appearance={clerkProfileAppearance} routing="hash" />
      </div>
    </div>
  );
}
