import type { ReactNode } from "react";
import { PLAN_LIMITS, normalizePlanKey } from "@telegram-builder/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBillingStatusTone,
  getDisplayPlan,
  getDisplayStatus,
} from "@/lib/creem-billing";

type SubscriptionSummary = {
  creemCustomerId?: string | null;
  currentPeriodEnd?: Date | null;
  plan?: string | null;
  status?: string | null;
};

type BillingPanelsProps = {
  isSignedIn: boolean;
  subscription?: SubscriptionSummary | null;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

function formatLimit(value: number) {
  return `${numberFormatter.format(value)} runs / month`;
}

function formatDate(value?: Date | null) {
  if (!value) {
    return "Not available yet";
  }

  return dateFormatter.format(value);
}

function PlanCard({
  cta,
  description,
  eyebrow,
  highlighted = false,
  limits,
  title,
}: {
  cta: ReactNode;
  description: string;
  eyebrow: string;
  highlighted?: boolean;
  limits: Array<string>;
  title: string;
}) {
  return (
    <Card
      className={highlighted ? "border-primary/55 bg-primary/5" : undefined}
    >
      <CardHeader>
        <Badge
          variant={highlighted ? "default" : "secondary"}
          className="w-fit"
        >
          {eyebrow}
        </Badge>
        <CardTitle className="font-[var(--font-display)] text-[1.35rem] tracking-[-0.03em]">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {limits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-start bg-transparent">{cta}</CardFooter>
    </Card>
  );
}

export function PricingPanels({
  isSignedIn,
  subscription,
}: BillingPanelsProps) {
  const currentPlan = normalizePlanKey(subscription?.plan);
  const freeLimits = PLAN_LIMITS.FREE;
  const proLimits = PLAN_LIMITS.PRO;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PlanCard
        eyebrow={currentPlan === "FREE" ? "Current plan" : "Included"}
        title="Free"
        description="Build and validate your first Telegram automation workspace without entering payment details."
        limits={[
          `${freeLimits.maxBots} bot connected at a time`,
          `${freeLimits.maxRulesPerBot} flow per bot`,
          formatLimit(freeLimits.monthlyExecutions),
        ]}
        cta={
          isSignedIn ? (
            <Button type="button" variant="secondary" disabled>
              {currentPlan === "FREE"
                ? "Current plan"
                : "Downgrade by canceling"}
            </Button>
          ) : (
            <Button asChild type="button" variant="secondary">
              <a href="/sign-up">Start free</a>
            </Button>
          )
        }
      />

      <PlanCard
        eyebrow={currentPlan === "PRO" ? "Current plan" : "Recommended"}
        title="Pro"
        description="Unlock higher execution volume and more automation capacity while keeping Telegraph’s current workflow model."
        limits={[
          `${proLimits.maxBots} bots connected`,
          `${proLimits.maxRulesPerBot} flows per bot`,
          formatLimit(proLimits.monthlyExecutions),
        ]}
        highlighted
        cta={
          isSignedIn ? (
            currentPlan === "PRO" ? (
              <Button asChild type="button" variant="outline">
                <a href="/portal">Manage billing</a>
              </Button>
            ) : (
              <Button asChild type="button">
                <a href="/api/checkout">Upgrade to Pro</a>
              </Button>
            )
          ) : (
            <Button asChild type="button">
              <a href="/sign-in?redirect_url=/pricing">Sign in to upgrade</a>
            </Button>
          )
        }
      />
    </div>
  );
}

export function BillingOverviewCard({
  subscription,
}: {
  subscription?: SubscriptionSummary | null;
}) {
  const plan = getDisplayPlan(subscription?.plan);
  const status = getDisplayStatus(subscription?.status);
  const statusTone = getBillingStatusTone(subscription?.status);
  const normalizedPlan = normalizePlanKey(subscription?.plan);
  const hasPortal = Boolean(subscription?.creemCustomerId);
  const showRecoveryWarning = normalizedPlan === "PRO" && !hasPortal;

  return (
    <Card className="interactive-lift">
      <CardHeader>
        <Badge
          variant={
            statusTone === "default"
              ? "default"
              : statusTone === "warning"
                ? "outline"
                : "secondary"
          }
          className="w-fit"
        >
          Telegraph billing
        </Badge>
        <CardTitle className="font-[var(--font-display)] text-[1.35rem] tracking-[-0.03em]">
          {plan} plan
        </CardTitle>
        <CardDescription>
          Subscription access is mirrored into Telegraph and enforced from this
          workspace state.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Status
          </p>
          <Badge
            variant={
              statusTone === "default"
                ? "default"
                : statusTone === "warning"
                  ? "outline"
                  : "secondary"
            }
          >
            {status}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Current period end
          </p>
          <p className="text-sm text-foreground">
            {formatDate(subscription?.currentPeriodEnd)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Billing portal
          </p>
          <p className="text-sm text-foreground">
            {hasPortal ? "Available" : "Available after customer sync"}
          </p>
        </div>
        {showRecoveryWarning ? (
          <div className="md:col-span-3">
            <p className="border border-border/80 bg-muted px-4 py-3 text-sm text-muted-foreground">
              Your paid plan is active, but the Creem customer link has not been
              saved locally yet. Refresh after the webhook lands or re-open the
              checkout return link.
            </p>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="gap-2 bg-transparent">
        {normalizedPlan === "PRO" ? (
          hasPortal ? (
            <Button asChild type="button" variant="outline">
              <a href="/portal">Open billing portal</a>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              Billing portal syncing
            </Button>
          )
        ) : (
          <Button asChild type="button">
            <a href="/api/checkout">Upgrade to Pro</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
