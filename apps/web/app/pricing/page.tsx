import type { ReactNode } from "react";
import { PricingTable } from "@clerk/nextjs";
import { CheckCircle2 } from "lucide-react";
import { PageHeading } from "@/components/PageHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { clerkCheckoutAppearance, clerkPricingAppearance } from "@/lib/clerk-appearance";

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      <span>{children}</span>
    </li>
  );
}

export default function PricingPage() {
  if (isClerkConfigured()) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="Pricing"
          subtitle="Upgrade or manage your subscription using Clerk Billing."
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

  return (
    <div className="space-y-6">
      <PageHeading
        title="Pricing"
        subtitle="Clerk billing is not configured in this environment."
      />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="interactive-lift flex h-full flex-col">
          <CardHeader className="min-h-[170px]">
            <Badge variant="secondary" className="w-fit">
              Starter
            </Badge>
            <CardTitle className="font-[var(--font-display)] text-3xl tracking-[-0.02em]">
              Free
            </CardTitle>
            <CardDescription>
              For early testing and single-bot builders.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="space-y-2">
              <Feature>1 bot</Feature>
              <Feature>3 flows per bot</Feature>
              <Feature>1,000 runs each month</Feature>
            </ul>
            <Button variant="outline" className="mt-auto w-full sm:w-auto">
              Current baseline
            </Button>
          </CardContent>
        </Card>

        <Card className="interactive-lift flex h-full flex-col border-primary/45 bg-primary/[0.045]">
          <CardHeader className="min-h-[170px]">
            <Badge className="w-fit">Recommended</Badge>
            <CardTitle className="font-[var(--font-display)] text-3xl tracking-[-0.02em]">
              Pro
            </CardTitle>
            <CardDescription>
              For production-grade Telegram automation operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="space-y-2">
              <Feature>20 bots</Feature>
              <Feature>100 flows per bot</Feature>
              <Feature>200,000 runs each month</Feature>
            </ul>
            <Button className="mt-auto w-full sm:w-auto">Upgrade to Pro</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
