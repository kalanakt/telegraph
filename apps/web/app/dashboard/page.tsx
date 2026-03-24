import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Bot, CalendarCheck2, Rocket, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { requireAppUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  if (isClerkConfigured()) {
    const { userId } = await auth();
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
    <div className="space-y-6">
      <PageHeading
        title="Automation dashboard"
        subtitle="Build, monitor, and scale Telegram automations from one workspace."
        action={<Badge>{user.subscription?.plan ?? "FREE"} plan</Badge>}
      />

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="interactive-lift lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-[1.32rem] font-[var(--font-display)] tracking-[-0.02em]">Workspace health</CardTitle>
            <CardDescription>Live snapshot of your current automation capacity and activity.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-secondary/45 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Bot className="h-4 w-4" />
                <span className="text-xs tracking-[0.06em]">Connected bots</span>
              </div>
              <p className="text-3xl font-semibold leading-none tracking-[-0.03em]">{botCount}</p>
            </div>

            <div className="rounded-lg bg-secondary/45 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs tracking-[0.06em]">Active flows</span>
              </div>
              <p className="text-3xl font-semibold leading-none tracking-[-0.03em]">{flowCount}</p>
            </div>

            <div className="rounded-lg bg-secondary/45 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <CalendarCheck2 className="h-4 w-4" />
                <span className="text-xs tracking-[0.06em]">Total runs</span>
              </div>
              <p className="text-3xl font-semibold leading-none tracking-[-0.03em]">{runCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-lift lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] tracking-[-0.02em]">Common actions</CardTitle>
            <CardDescription>Jump directly to the pages you use most.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/bots">
                <Rocket className="h-4 w-4" />
                Add bot
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/rules">Create flow</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/runs">View runs</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="interactive-lift">
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] tracking-[-0.02em]">Quick start</CardTitle>
            <CardDescription>Trigger first, optional conditions second, actions last.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Connect your BotFather API token from the Bots page.</p>
            <p>2. Open Flows and pick a trigger for incoming events.</p>
            <p>3. Add condition and action nodes from the inline plus controls.</p>
          </CardContent>
        </Card>

        <Card className="interactive-lift border-primary/30">
          <CardHeader>
            <Badge className="w-fit">Reliability</Badge>
            <CardTitle className="font-[var(--font-display)] tracking-[-0.02em]">Production-ready by default</CardTitle>
            <CardDescription>Queue-backed processing and run logs help you ship with confidence.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
