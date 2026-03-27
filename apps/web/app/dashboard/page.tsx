import Link from "next/link";
import { Bot, CalendarCheck2, Rocket, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { getAuthUserId } from "@/lib/clerk-auth";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

function StatTile({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="metric-tile flex flex-col gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex size-9 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p className="text-[2rem] font-semibold leading-none tracking-[-0.05em]">{value}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export default async function DashboardPage() {
  if (isClerkConfigured()) {
    const userId = await getAuthUserId();
    if (!userId) {
      redirect("/sign-in");
    }
  }

  const user = await requireAppUser();

  const [botCount, flowCount, runCount] = await Promise.all([
    prisma.bot.count({ where: { userId: user.id } }),
    prisma.workflowRule.count({ where: { userId: user.id } }),
    prisma.workflowRun.count({ where: { userId: user.id } })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Automation dashboard"
        subtitle="Build, monitor, and scale Telegram automations from one workspace."
        action={<Badge variant="outline">{user.subscription?.plan ?? "FREE"} plan</Badge>}
      />

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="interactive-lift lg:col-span-8 2xl:col-span-9">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Live overview
            </Badge>
            <CardTitle className="text-[1.36rem] font-[var(--font-display)] tracking-[-0.03em]">
              Workspace health
            </CardTitle>
            <CardDescription>
              A quick read on current capacity, builder count, and execution volume across your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <StatTile icon={Bot} label="Connected bots" value={botCount} detail="Bots with active webhooks and stored credentials." />
            <StatTile icon={Sparkles} label="Active builders" value={flowCount} detail="Published or in-progress workflow definitions." />
            <StatTile icon={CalendarCheck2} label="Total runs" value={runCount} detail="Historical execution volume available for review." />
          </CardContent>
        </Card>

        <Card className="interactive-lift lg:col-span-4 2xl:col-span-3">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Shortcuts
            </Badge>
            <CardTitle className="font-[var(--font-display)] tracking-[-0.03em]">Common actions</CardTitle>
            <CardDescription>Jump into the pages your team reaches for most often.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/bots">
                <Rocket data-icon="inline-start" />
                Add bot
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/builder">Open builder</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/runs">View runs</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] 2xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="interactive-lift">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Getting started
            </Badge>
            <CardTitle className="font-[var(--font-display)] tracking-[-0.03em]">Quick start</CardTitle>
            <CardDescription>Trigger first, optional conditions second, actions last.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 1
              </p>
              <p>Connect your BotFather API token from the Bots page.</p>
            </div>
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 2
              </p>
              <p>Open Builder and pick a trigger for incoming events.</p>
            </div>
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 3
              </p>
              <p>Add condition and action nodes from the inline plus controls.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-lift">
          <CardHeader>
            <Badge className="w-fit">Reliability</Badge>
            <CardTitle className="font-[var(--font-display)] tracking-[-0.03em]">Production-ready by default</CardTitle>
            <CardDescription>Queue-backed processing and run logs help you ship with confidence.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Durable execution
              </p>
              <p>Action jobs move through Redis-backed workers instead of depending on page request lifecycles.</p>
            </div>
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Audit trail
              </p>
              <p>Workflow runs and action status history give operators something concrete to inspect during incidents.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
