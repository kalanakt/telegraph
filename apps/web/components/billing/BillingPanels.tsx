"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PLAN_LIMITS, normalizePlanKey } from "@telegram-builder/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBillingStatusTone,
  getDisplayPlan,
  getDisplayStatus,
} from "@/lib/billing-display";

type SubscriptionSummary = {
  creemCustomerId?: string | null;
  currentPeriodEndLabel?: string | null;
  plan?: string | null;
  status?: string | null;
};

type BillingPanelsProps = {
  isSignedIn: boolean;
  subscription?: SubscriptionSummary | null;
};

type BillingInterval = "monthly" | "yearly";

const numberFormatter = new Intl.NumberFormat("en-US");
const DISPLAY_PRICES: Record<BillingInterval, { label: string; note: string }> = {
  monthly: {
    label: "$5",
    note: "per month"
  },
  yearly: {
    label: "$50",
    note: "per year"
  }
};

function formatLimit(value: number) {
  return `${numberFormatter.format(value)} runs / month`;
}

function PlanCard({
  cta,
  description,
  eyebrow,
  highlighted = false,
  limits,
  title,
  price,
  priceNote,
}: {
  cta: ReactNode;
  description: string;
  eyebrow: string;
  highlighted?: boolean;
  limits: Array<string>;
  title: string;
  price: string;
  priceNote?: string;
}) {
  return (
    <section
      className={
        highlighted
          ? "public-band flex h-full flex-col border-primary/45"
          : "public-card flex h-full flex-col"
      }
    >
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Badge
            variant={highlighted ? "default" : "secondary"}
            className="w-fit rounded-lg"
          >
            {eyebrow}
          </Badge>
          <div className="grid gap-3">
            <h3 className="font-display text-[1.7rem] font-semibold text-foreground">
              {title}
            </h3>
            <div className="flex items-end gap-2">
              <p className="text-[2.2rem] font-semibold leading-none text-foreground">
                {price}
              </p>
              {priceNote ? (
                <p className="pb-1 text-[0.72rem] font-semibold uppercase text-muted-foreground">
                  {priceNote}
                </p>
              ) : null}
            </div>
            <p className="max-w-[48ch] text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <ul className="grid gap-3 text-sm text-muted-foreground">
          {limits.map((item) => (
            <li key={item} className="flex items-start gap-3 leading-6">
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-secondary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-2">{cta}</div>
      </div>
    </section>
  );
}

function StatusPill({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="public-card flex flex-col gap-2">
      <p className="public-kicker">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

export function PricingPanels({
  isSignedIn,
  subscription,
}: BillingPanelsProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const currentPlan = normalizePlanKey(subscription?.plan);
  const freeLimits = PLAN_LIMITS.FREE;
  const proLimits = PLAN_LIMITS.PRO;
  const proPrice = DISPLAY_PRICES[billingInterval];

  return (
    <div className="grid gap-6">
      <div className="flex justify-start md:justify-center">
        <div
          data-slot="button-group"
          className="grid w-full max-w-sm grid-cols-2 rounded-lg border border-border/70 bg-background/82 p-1 shadow-[0_18px_46px_-36px_rgba(44,33,21,0.45)]"
        >
          <Button
            type="button"
            size="sm"
            variant={billingInterval === "monthly" ? "default" : "ghost"}
            className="w-full rounded-md"
            onClick={() => setBillingInterval("monthly")}
          >
            Monthly
          </Button>
          <Button
            type="button"
            size="sm"
            variant={billingInterval === "yearly" ? "default" : "ghost"}
            className="w-full rounded-md"
            onClick={() => setBillingInterval("yearly")}
          >
            Yearly
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanCard
          eyebrow={currentPlan === "FREE" ? "Current plan" : "Included"}
          title="Free"
          price="$0"
          priceNote="forever"
          description="Build and validate your first Telegram automation workspace without entering payment details."
          limits={[
            `${freeLimits.maxBots} bot connected at a time`,
            `${freeLimits.maxRulesPerBot} flow per bot`,
            formatLimit(freeLimits.monthlyExecutions),
          ]}
          cta={
            isSignedIn ? (
              <Button
                type="button"
                variant="secondary"
                disabled
                className="w-full rounded-lg sm:w-auto"
              >
                {currentPlan === "FREE" ? "Current plan" : "Downgrade by canceling"}
              </Button>
            ) : (
              <Button
                asChild
                type="button"
                variant="secondary"
                className="w-full rounded-lg sm:w-auto"
              >
                <a href="/sign-up">Start free</a>
              </Button>
            )
          }
        />

        <PlanCard
          eyebrow={currentPlan === "PRO" ? "Current plan" : "Recommended"}
          title="Pro"
          price={proPrice.label}
          priceNote={proPrice.note}
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
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg sm:w-auto"
                >
                  <a href="/portal">Manage billing</a>
                </Button>
              ) : (
                <Button asChild type="button" className="w-full rounded-lg sm:w-auto">
                  <a href={`/api/checkout?interval=${billingInterval}`}>Upgrade to Pro</a>
                </Button>
              )
            ) : (
              <Button asChild type="button" className="w-full rounded-lg sm:w-auto">
                <a href={`/sign-in?redirect_url=/pricing`}>Sign in to upgrade</a>
              </Button>
            )
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusPill label="Billing model" value="Choose monthly or yearly checkout at the moment you upgrade." />
        <StatusPill label="Workspace fit" value="Free is for early validation. Pro is for teams running real workflow volume." />
        <StatusPill label="Upgrade path" value="Paid workspaces keep the same builder and execution model. You just gain more room to operate." />
      </div>
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
        <CardTitle className="font-display text-[1.35rem]">
          {plan} plan
        </CardTitle>
        <CardDescription>
          Subscription access is mirrored into Telegraph and enforced from this
          workspace state.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[0.72rem] font-semibold uppercase text-muted-foreground">
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
          <p className="text-[0.72rem] font-semibold uppercase text-muted-foreground">
            Current period end
          </p>
          <p className="text-sm text-foreground">
            {subscription?.currentPeriodEndLabel ?? "Not available yet"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[0.72rem] font-semibold uppercase text-muted-foreground">
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
