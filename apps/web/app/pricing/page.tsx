import type { ReactNode } from "react";
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
import { getAuthUserId } from "@/lib/clerk-auth";
import { requireAppUser } from "@/lib/user";

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      <span>{children}</span>
    </li>
  );
}

export default function PricingPage() {
  const hasClerk = isClerkConfigured();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Pricing"
        subtitle="Upgrade or manage your subscription with Creem."
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
              For early testing and single-bot flows.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="space-y-2">
              <Feature>1 bot</Feature>
              <Feature>3 flows per bot</Feature>
              <Feature>1,000 runs each month</Feature>
            </ul>
            <Button variant="outline" className="mt-auto w-full sm:w-auto" asChild>
              <a href="/dashboard">
              Current baseline
              </a>
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
            <UpgradeButton hasClerk={hasClerk} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function UpgradeButton({ hasClerk }: { hasClerk: boolean }) {
  const userId = await getAuthUserId();

  // Not signed in: send them to auth first.
  if (hasClerk && !userId) {
    return (
      <Button className="mt-auto w-full sm:w-auto" asChild>
        <a href="/sign-in?redirect_url=/pricing">Sign in to upgrade</a>
      </Button>
    );
  }

  let plan: string | null = null;
  try {
    const user = await requireAppUser();
    plan = user.subscription?.plan ?? null;
  } catch {
    plan = null;
  }

  if (plan === "PRO") {
    return (
      <Button className="mt-auto w-full sm:w-auto" variant="outline" asChild>
        <a href="/api/creem/portal">Manage billing</a>
      </Button>
    );
  }

  return (
    <Button className="mt-auto w-full sm:w-auto" asChild>
      <a href="/api/creem/checkout?plan=pro">Upgrade to Pro</a>
    </Button>
  );
}
