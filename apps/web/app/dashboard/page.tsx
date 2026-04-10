import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  CalendarCheck2,
  Clock3,
  MoveRight,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";
import type { RunsOverTimePoint } from "@/components/dashboard/RunsOverTimeChart";
import { RunsOverTimeChartClient } from "@/components/dashboard/RunsOverTimeChartClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthUserId } from "@/lib/clerk-auth";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

const numberFormatter = new Intl.NumberFormat("en-US");
const chartDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const RUN_ACTIVITY_WINDOW_DAYS = 14;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function buildRunActivityPoints(
  runs: Array<{ createdAt: Date }>,
  days: number,
  today: Date,
): RunsOverTimePoint[] {
  const windowStart = addUtcDays(today, -(days - 1));
  const runCountsByDay = new Map<string, number>();

  for (const run of runs) {
    const dayKey = run.createdAt.toISOString().slice(0, 10);
    runCountsByDay.set(dayKey, (runCountsByDay.get(dayKey) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, offset) => {
    const day = addUtcDays(windowStart, offset);
    const iso = day.toISOString().slice(0, 10);
    const label = chartDateFormatter.format(day);

    return {
      iso,
      label,
      tickLabel: offset === days - 1 ? "Today" : label,
      value: runCountsByDay.get(iso) ?? 0,
    };
  });
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="metric-tile flex flex-col gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex size-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p className="text-[2rem] font-semibold leading-none tracking-[-0.05em]">
        {typeof value === "number" ? numberFormatter.format(value) : value}
      </p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function UtilitySection({
  badge,
  title,
  description,
  children,
}: {
  badge: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border/80 bg-card">
      <div className="border-b border-border/70 px-5 py-5">
        <Badge variant="secondary" className="w-fit">
          {badge}
        </Badge>
        <div className="mt-3 space-y-1">
          <h2 className="font-(--font-display) text-[1.08rem] font-semibold tracking-[-0.03em]">
            {title}
          </h2>
          <p className="max-w-[54ch] text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export default async function DashboardPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await requireAppUser();
  const today = startOfUtcDay(new Date());
  const activityWindowStart = addUtcDays(
    today,
    -(RUN_ACTIVITY_WINDOW_DAYS - 1),
  );

  const [botCount, flowCount, runCount, recentRuns] = await Promise.all([
    prisma.bot.count({ where: { userId: user.id } }),
    prisma.workflowRule.count({ where: { userId: user.id } }),
    prisma.workflowRun.count({ where: { userId: user.id } }),
    prisma.workflowRun.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: activityWindowStart },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const runActivity = buildRunActivityPoints(
    recentRuns,
    RUN_ACTIVITY_WINDOW_DAYS,
    today,
  );
  const runActivityTotal = runActivity.reduce(
    (sum, point) => sum + point.value,
    0,
  );
  const todayRuns = runActivity[runActivity.length - 1]?.value ?? 0;
  const peakDay = runActivity.reduce((currentPeak, point) =>
    point.value > currentPeak.value ? point : currentPeak,
  );
  const averageRuns =
    runActivityTotal === 0
      ? "0"
      : (runActivityTotal / runActivity.length).toFixed(
          runActivityTotal % runActivity.length === 0 ? 0 : 1,
        );

  return (
    <div className="min-w-0 space-y-5">
      <section className="border-b border-border/70 pb-5 lg:pb-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
            <div className="space-y-5">
              <div className="space-y-3">
                <Badge variant="secondary" className="w-fit">
                  Operations
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-(--font-display) text-[2.4rem] font-semibold leading-none tracking-[-0.06em]">
                    Dashboard
                  </h1>
                  <p className="max-w-[62ch] text-sm leading-6 text-muted-foreground">
                    Track workspace health, inspect run volume, and jump straight
                    back into the surfaces that keep Telegram automations
                    shipping.
                  </p>
                </div>
              </div>

              <div className="grid gap-px border border-border/80 bg-border/80 sm:grid-cols-3">
                <div className="bg-background p-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Connected bots
                  </p>
                  <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em]">
                    {numberFormatter.format(botCount)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Bots with active webhooks and stored credentials.
                  </p>
                </div>
                <div className="bg-background p-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Active flows
                  </p>
                  <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em]">
                    {numberFormatter.format(flowCount)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Published or in-progress workflow definitions.
                  </p>
                </div>
                <div className="bg-background p-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Historical runs
                  </p>
                  <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em]">
                    {numberFormatter.format(runCount)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Execution volume currently available for review.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-border/80 bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Current window
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.04em]">
                    Execution snapshot
                  </p>
                </div>
                <Badge variant="outline">
                  {RUN_ACTIVITY_WINDOW_DAYS}-day window
                </Badge>
              </div>

              <div className="mt-5 grid gap-px border border-border/80 bg-border/80">
                <div className="grid gap-px bg-border/80 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="bg-background p-4">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Window total
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                      {numberFormatter.format(runActivityTotal)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Recorded from {runActivity[0]?.label} to{" "}
                      {runActivity[runActivity.length - 1]?.label}.
                    </p>
                  </div>
                  <div className="bg-background p-4">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Peak day
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                      {numberFormatter.format(peakDay.value)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {peakDay.value === 0
                        ? "No completed activity has landed in this window yet."
                        : `${peakDay.label} carried the highest run volume.`}
                    </p>
                  </div>
                  <div className="bg-background p-4">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Daily pace
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                      {averageRuns}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Today has logged {numberFormatter.format(todayRuns)} run
                      {todayRuns === 1 ? "" : "s"} so far.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <Button asChild>
                  <Link href="/bots">
                    <Rocket data-icon="inline-start" />
                    Add bot
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/flows">
                    Open flows
                    <MoveRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/runs">Inspect runs</Link>
                </Button>
              </div>
            </div>
          </div>
      </section>

      <section className="grid gap-6 border-b border-border/70 pb-5 lg:pb-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <section className="border border-border/80 bg-card">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5">
              <div className="space-y-1">
                <Badge variant="secondary" className="w-fit">
                  Activity
                </Badge>
                <h2 className="font-(--font-display) text-[1.08rem] font-semibold tracking-[-0.03em]">
                  Runs over time
                </h2>
                <p className="max-w-[54ch] text-sm text-muted-foreground">
                  Daily workflow executions across all flows for the last{" "}
                  {RUN_ACTIVITY_WINDOW_DAYS} days.
                </p>
              </div>
              <Badge variant="outline">Live overview</Badge>
            </div>
            <div className="px-5 py-5">
              <RunsOverTimeChartClient points={runActivity} />
            </div>
            <div className="grid gap-px border-t border-border/80 bg-border/80 sm:grid-cols-3">
              <div className="bg-muted/50 p-4">
                <StatTile
                  icon={Activity}
                  label="Window total"
                  value={runActivityTotal}
                  detail={`Runs recorded from ${runActivity[0]?.label} to ${runActivity[runActivity.length - 1]?.label}.`}
                />
              </div>
              <div className="bg-muted/50 p-4">
                <StatTile
                  icon={CalendarCheck2}
                  label="Peak day"
                  value={peakDay.value}
                  detail={
                    peakDay.value === 0
                      ? "No completed workflow activity has landed in this window yet."
                      : `${peakDay.label} carried the highest run volume.`
                  }
                />
              </div>
              <div className="bg-muted/50 p-4">
                <StatTile
                  icon={Clock3}
                  label="Daily pace"
                  value={averageRuns}
                  detail={`Today has logged ${numberFormatter.format(todayRuns)} run${todayRuns === 1 ? "" : "s"} so far.`}
                />
              </div>
            </div>
          </section>

          <div className="grid gap-6">
            <UtilitySection
              badge="Getting started"
              title="Quick start"
              description="Trigger first, optional conditions second, actions last."
            >
              <div className="grid gap-px border border-border/80 bg-border/80">
                <div className="bg-background p-4 text-sm text-muted-foreground">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Step 1
                  </p>
                  <p className="mt-2">
                    Connect your BotFather API token from the Bots page.
                  </p>
                </div>
                <div className="bg-background p-4 text-sm text-muted-foreground">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Step 2
                  </p>
                  <p className="mt-2">
                    Open Flows and pick a trigger for incoming events.
                  </p>
                </div>
                <div className="bg-background p-4 text-sm text-muted-foreground">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Step 3
                  </p>
                  <p className="mt-2">
                    Add condition and action nodes from the inline plus
                    controls.
                  </p>
                </div>
              </div>
            </UtilitySection>

            <UtilitySection
              badge="Reliability"
              title="Production-ready by default"
              description="Queue-backed processing and run logs help operators spot issues fast."
            >
              <div className="grid gap-px border border-border/80 bg-border/80">
                <div className="bg-background p-4 text-sm text-muted-foreground">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Durable execution
                  </p>
                  <p className="mt-2">
                    Action jobs move through Redis-backed workers instead of
                    depending on page request lifecycles.
                  </p>
                </div>
                <div className="bg-background p-4 text-sm text-muted-foreground">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Audit trail
                  </p>
                  <p className="mt-2">
                    Workflow runs and action status history give operators
                    something concrete to inspect during incidents.
                  </p>
                </div>
                <div className="bg-background p-4 text-sm text-muted-foreground">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Guardrails
                  </p>
                  <p className="mt-2">
                    Billing and plan limits are checked before new work is
                    enqueued, which keeps execution predictable.
                  </p>
                </div>
              </div>
            </UtilitySection>
          </div>
      </section>

      <section>
          <div className="grid gap-6 border border-border/80 bg-card p-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                Operating notes
              </Badge>
              <div className="space-y-2">
                <h2 className="font-(--font-display) text-[1.08rem] font-semibold tracking-[-0.03em]">
                  Where to focus next
                </h2>
                <p className="max-w-[56ch] text-sm leading-6 text-muted-foreground">
                  The dashboard now behaves like a workspace surface instead of
                  a marketing page: left rail for movement, primary data in the
                  center, and support panels off to the side.
                </p>
              </div>
            </div>

            <div className="grid gap-px border border-border/80 bg-border/80">
              <div className="bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center bg-primary/12 text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Flows stay central</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The main canvas of the page is now reserved for activity
                      and operating context instead of stacked promo-style cards.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center bg-primary/12 text-primary">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Support info is quieter</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reliability, billing, and setup guidance still exist, but
                      they no longer compete with the dashboard’s main working
                      surface.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </section>
    </div>
  );
}
