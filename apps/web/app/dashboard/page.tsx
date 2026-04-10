import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  CalendarCheck2,
  Check,
  Clock3,
  MoveRight,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
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

function getWorkspaceStatus(botCount: number, flowCount: number, runCount: number) {
  if (botCount === 0) {
    return {
      label: "Setup needed",
      title: "Connect your first Telegram bot",
      description:
        "The workspace is ready, but it still needs a BotFather token before flows can receive events or queue actions.",
      ctaHref: "/bots",
      ctaLabel: "Open bots",
    };
  }

  if (flowCount === 0) {
    return {
      label: "Ready for flows",
      title: "Create the first automation path",
      description:
        "You have a bot connected. The next useful step is wiring a trigger, optional conditions, and the actions you want to send.",
      ctaHref: "/flows",
      ctaLabel: "Open flows",
    };
  }

  if (runCount === 0) {
    return {
      label: "Awaiting activity",
      title: "Everything is configured and waiting for live events",
      description:
        "Your bot and flows are in place. Trigger a Telegram event or publish a flow to start generating run history.",
      ctaHref: "/runs",
      ctaLabel: "Inspect runs",
    };
  }

  return {
    label: "Active workspace",
    title: "Automation traffic is moving through the system",
    description:
      "Use this dashboard to monitor throughput, spot slow days, and jump back into the core surfaces that keep workflows shipping.",
    ctaHref: "/runs",
    ctaLabel: "Review run history",
  };
}

function OverviewMetric({
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
    <div className="bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex size-9 items-center justify-center border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.05em] tabular-nums">
        {typeof value === "number" ? numberFormatter.format(value) : value}
      </p>
      <p className="mt-2 max-w-[30ch] text-sm leading-6 text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

function ActivityStat({
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
    <div className="bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] tabular-nums">
        {typeof value === "number" ? numberFormatter.format(value) : value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function MiniRunTrend({ points }: { points: RunsOverTimePoint[] }) {
  const safePoints = points.length
    ? points
    : [{ iso: "today", label: "Today", tickLabel: "Today", value: 0 }];
  const maxValue = Math.max(...safePoints.map((point) => point.value), 1);

  return (
    <div className="border border-border/80 bg-background px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Recent trend
          </p>
          <p className="mt-1 text-sm font-semibold">Last 7 days</p>
        </div>
        <Badge variant="outline">{safePoints.length} points</Badge>
      </div>
      <div className="mt-4 grid h-28 grid-cols-7 items-end gap-2">
        {safePoints.map((point) => {
          const height = point.value === 0 ? 12 : Math.max((point.value / maxValue) * 100, 18);

          return (
            <div key={point.iso} className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end">
                <div
                  className="w-full border border-primary/20 bg-primary/12"
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="w-full text-center">
                <p className="truncate text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {point.tickLabel}
                </p>
                <p className="mt-1 text-[0.75rem] font-medium tabular-nums">
                  {numberFormatter.format(point.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChecklistItem({
  done,
  title,
  detail,
}: {
  done: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border border-border/80 bg-background text-muted-foreground">
        {done ? <Check className="size-3.5 text-primary" /> : <span className="text-[0.68rem] font-semibold">•</span>}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function RailSection({
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
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
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
  const status = getWorkspaceStatus(botCount, flowCount, runCount);
  const windowRange = `${runActivity[0]?.label ?? "Start"} - ${runActivity[runActivity.length - 1]?.label ?? "Today"}`;
  const recentTrend = runActivity.slice(-7);
  const checklist = [
    {
      done: botCount > 0,
      title: "Connect at least one bot",
      detail:
        "Add a BotFather token on the Bots page so Telegraph can receive updates and send actions back to Telegram.",
    },
    {
      done: flowCount > 0,
      title: "Publish a workflow",
      detail:
        "Build a trigger-first flow, then add the conditions and actions that should fire when an event arrives.",
    },
    {
      done: runCount > 0,
      title: "Verify live execution",
      detail:
        "Use the Runs page to confirm that real Telegram traffic is producing workflow and action history.",
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeading
        title="Dashboard"
        subtitle="Monitor workspace health, see whether automation traffic is moving, and jump back into the main operating surfaces without hunting through the product."
        action={
          <div className="flex w-full flex-wrap gap-2 md:w-auto">
            <Button asChild size="sm">
              <Link href="/bots">
                <Rocket data-icon="inline-start" />
                Add bot
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/flows">
                Open flows
                <MoveRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <article className="border border-border/80 bg-card">
          <div className="grid gap-6 p-5 lg:p-6">
            <div className="grid gap-5 lg:items-start lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  {status.label}
                </Badge>
                <div className="space-y-2">
                  <h2 className="font-(--font-display) text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] text-balance">
                    {status.title}
                  </h2>
                  <p className="max-w-[58ch] text-sm leading-6 text-muted-foreground text-pretty">
                    {status.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={status.ctaHref}>
                      {status.ctaLabel}
                      <MoveRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/runs">See recent runs</Link>
                  </Button>
                </div>
                <MiniRunTrend points={recentTrend} />
              </div>

              <aside className="h-fit border border-border/80 bg-background px-4 py-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Activity window
                </p>
                <p className="mt-2 font-(--font-display) text-[1.65rem] font-semibold leading-none tracking-[-0.05em] tabular-nums">
                  {numberFormatter.format(runActivityTotal)}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Runs recorded over the last {RUN_ACTIVITY_WINDOW_DAYS} days.
                </p>
                <div className="mt-4 space-y-3 border-t border-border/70 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Today</span>
                    <span className="font-semibold tabular-nums">
                      {numberFormatter.format(todayRuns)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Peak day</span>
                    <span className="font-semibold">
                      {peakDay.value === 0 ? "None yet" : peakDay.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Average pace</span>
                    <span className="font-semibold tabular-nums">{averageRuns}</span>
                  </div>
                </div>
              </aside>
            </div>

            <div className="grid gap-px border border-border/80 bg-border/80 md:grid-cols-3">
              <OverviewMetric
                icon={Bot}
                label="Connected bots"
                value={botCount}
                detail="Bots with stored credentials and webhook connectivity available to the workspace."
              />
              <OverviewMetric
                icon={Sparkles}
                label="Saved flows"
                value={flowCount}
                detail="Workflow definitions available to receive events, branch on conditions, and dispatch actions."
              />
              <OverviewMetric
                icon={Activity}
                label="Historical runs"
                value={runCount}
                detail="Total execution history currently available for review, debugging, and operations follow-up."
              />
            </div>
          </div>
        </article>

        <div className="grid content-start gap-6 self-start">
          <RailSection
            badge="Next steps"
            title="Operator checklist"
            description="The dashboard should make the next useful move obvious, especially when a workspace is still getting configured."
          >
            <div className="space-y-3">
              {checklist.map((item) => (
                <ChecklistItem
                  key={item.title}
                  done={item.done}
                  title={item.title}
                  detail={item.detail}
                />
              ))}
            </div>
          </RailSection>

          <RailSection
            badge="Shortcuts"
            title="Fast navigation"
            description="Jump directly into the surfaces that most often follow a dashboard review."
          >
            <div className="grid gap-2">
              <Button asChild variant="outline" className="justify-between">
                <Link href="/bots">
                  Manage bots
                  <MoveRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/flows">
                  Edit flows
                  <MoveRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/runs">
                  Audit run logs
                  <MoveRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </RailSection>
        </div>
      </section>

      <section className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <article className="border border-border/80 bg-card">
          <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <Badge variant="secondary" className="w-fit">
                Activity
              </Badge>
              <h2 className="font-(--font-display) text-[1.12rem] font-semibold tracking-[-0.03em]">
                Runs over time
              </h2>
              <p className="max-w-[52ch] text-sm leading-6 text-muted-foreground">
                Daily workflow executions across the current {RUN_ACTIVITY_WINDOW_DAYS}-day window.
              </p>
            </div>
            <div className="border border-border/80 bg-background px-3 py-2 text-right">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Window range
              </p>
              <p className="mt-1 text-sm font-semibold">{windowRange}</p>
            </div>
          </div>

          <div className="px-5 py-5">
            <RunsOverTimeChartClient points={runActivity} />
          </div>

          <div className="grid gap-px border-t border-border/80 bg-border/80 md:grid-cols-3">
            <ActivityStat
              icon={CalendarCheck2}
              label="Window total"
              value={runActivityTotal}
              detail={`Recorded from ${runActivity[0]?.label} to ${runActivity[runActivity.length - 1]?.label}.`}
            />
            <ActivityStat
              icon={Activity}
              label="Peak day"
              value={peakDay.value}
              detail={
                peakDay.value === 0
                  ? "No completed workflow activity has landed in this window yet."
                  : `${peakDay.label} carried the highest run volume.`
              }
            />
            <ActivityStat
              icon={Clock3}
              label="Daily pace"
              value={averageRuns}
              detail={`Today has logged ${numberFormatter.format(todayRuns)} run${todayRuns === 1 ? "" : "s"} so far.`}
            />
          </div>
        </article>

        <div className="grid content-start gap-6 self-start">
          <RailSection
            badge="Reliability"
            title="What the platform is handling for you"
            description="Support information should stay nearby, but it should not compete with the core working surface."
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
                <span className="flex size-8 shrink-0 items-center justify-center border border-border/80 bg-background text-primary">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Queue-backed execution</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Action jobs move through background workers so workflow execution does not depend on a single request lifecycle.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-border/70 pt-3">
                <span className="flex size-8 shrink-0 items-center justify-center border border-border/80 bg-background text-primary">
                  <Activity className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Inspectable audit trail</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Workflow runs and action history stay visible so operators can trace failures and verify completed work.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-border/70 pt-3">
                <span className="flex size-8 shrink-0 items-center justify-center border border-border/80 bg-background text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Pre-flight guardrails</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Billing and plan checks run before new work is enqueued, which helps keep execution predictable as the workspace grows.
                  </p>
                </div>
              </div>
            </div>
          </RailSection>
        </div>
      </section>
    </div>
  );
}
