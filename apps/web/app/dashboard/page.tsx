import Link from "next/link";
import {
  Activity,
  Bot,
  CalendarCheck2,
  Clock3,
  Rocket,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";
import type { RunsOverTimePoint } from "@/components/dashboard/RunsOverTimeChart";
import { PageHeading } from "@/components/PageHeading";
import { RunsOverTimeChartClient } from "@/components/dashboard/RunsOverTimeChartClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  icon: typeof Bot;
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
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="interactive-lift lg:col-span-8 2xl:col-span-9">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Live overview
            </Badge>
            <CardTitle className="text-[1.36rem] font-(--font-display) tracking-[-0.03em]">
              Workspace health
            </CardTitle>
            <CardDescription>
              A quick read on current capacity, flow count, and execution volume
              across your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <StatTile
              icon={Bot}
              label="Connected bots"
              value={botCount}
              detail="Bots with active webhooks and stored credentials."
            />
            <StatTile
              icon={Sparkles}
              label="Active flows"
              value={flowCount}
              detail="Published or in-progress workflow definitions."
            />
            <StatTile
              icon={CalendarCheck2}
              label="Total runs"
              value={runCount}
              detail="Historical execution volume available for review."
            />
          </CardContent>
        </Card>

        <Card className="interactive-lift lg:col-span-4 2xl:col-span-3">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Shortcuts
            </Badge>
            <CardTitle className="font-(--font-display) tracking-[-0.03em]">
              Common actions
            </CardTitle>
            <CardDescription>
              Jump into the pages your team reaches for most often.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/bots">
                <Rocket data-icon="inline-start" />
                Add bot
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/flows">Open flows</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/runs">View runs</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="interactive-lift">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Activity
            </Badge>
            <CardAction>
              <Badge variant="outline">
                {RUN_ACTIVITY_WINDOW_DAYS}-day window
              </Badge>
            </CardAction>
            <CardTitle className="font-(--font-display) tracking-[-0.03em]">
              Runs over time
            </CardTitle>
            <CardDescription>
              Daily workflow executions across all flows for the last{" "}
              {RUN_ACTIVITY_WINDOW_DAYS} days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <RunsOverTimeChartClient points={runActivity} />
          </CardContent>
          <CardFooter className="grid gap-3 sm:grid-cols-3">
            <StatTile
              icon={Activity}
              label="Window total"
              value={runActivityTotal}
              detail={`Runs recorded from ${runActivity[0]?.label} to ${runActivity[runActivity.length - 1]?.label}.`}
            />
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
            <StatTile
              icon={Clock3}
              label="Daily pace"
              value={averageRuns}
              detail={`Today has logged ${numberFormatter.format(todayRuns)} run${todayRuns === 1 ? "" : "s"} so far.`}
            />
          </CardFooter>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] 2xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="interactive-lift">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Getting started
            </Badge>
            <CardTitle className="font-(--font-display) tracking-[-0.03em]">
              Quick start
            </CardTitle>
            <CardDescription>
              Trigger first, optional conditions second, actions last.
            </CardDescription>
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
              <p>Open Flows and pick a trigger for incoming events.</p>
            </div>
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 3
              </p>
              <p>
                Add condition and action nodes from the inline plus controls.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-lift">
          <CardHeader>
            <Badge className="w-fit">Reliability</Badge>
            <CardTitle className="font-(--font-display) tracking-[-0.03em]">
              Production-ready by default
            </CardTitle>
            <CardDescription>
              Queue-backed processing and run logs help you ship with
              confidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Durable execution
              </p>
              <p>
                Action jobs move through Redis-backed workers instead of
                depending on page request lifecycles.
              </p>
            </div>
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Audit trail
              </p>
              <p>
                Workflow runs and action status history give operators something
                concrete to inspect during incidents.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
