import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      <span>{text}</span>
    </li>
  );
}

export default async function HomePage() {
  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (userId) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="space-y-10 pb-4 pt-2 md:space-y-12">
      <section className="surface-panel relative overflow-hidden rounded-3xl p-8 md:p-12">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-20 h-48 w-48 rounded-full bg-accent/70 blur-3xl" />

        <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="max-w-3xl space-y-5">
            <Badge variant="secondary" className="w-fit">
              Built for production teams
            </Badge>

            <h1 className="text-4xl font-semibold leading-[0.98] tracking-[-0.04em] md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
              Telegram automations that hold up under real traffic.
            </h1>

            <p className="max-w-[62ch] text-base text-muted-foreground md:text-lg">
              Telegraph gives you a visual flow builder, execution history, and queue-backed processing so your bot logic stays reliable when usage climbs.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-in">
                  Start building
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
          </div>

          <Card className="interactive-lift border-white/75 bg-white/90">
            <CardHeader>
              <CardTitle className="text-xl font-[var(--font-display)] tracking-[-0.02em]">Recent account snapshot</CardTitle>
              <CardDescription>Typical workload from teams running event-driven campaigns.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Median run success</p>
                <p className="text-2xl font-semibold tracking-[-0.02em]">97.4%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Runs this week</p>
                <p className="text-2xl font-semibold tracking-[-0.02em]">14,280</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Average processing</p>
                <p className="text-2xl font-semibold tracking-[-0.02em]">218ms</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="interactive-lift lg:col-span-7">
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] text-[1.4rem] tracking-[-0.02em]">Design flows visually</CardTitle>
            <CardDescription>
              Create trigger-condition-action chains in the canvas and publish without writing background workers from scratch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              <Feature text="Message, command, callback, and inline triggers" />
              <Feature text="True and false branching for condition nodes" />
              <Feature text="Action presets for Telegram-native operations" />
              <Feature text="Validation before every save and publish" />
            </ul>
          </CardContent>
        </Card>

        <Card className="interactive-lift lg:col-span-5">
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] text-[1.25rem] tracking-[-0.02em]">Observe every run</CardTitle>
            <CardDescription>Each workflow run stores per-action status so debugging stays fast.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Inspect failures by action type, retry quickly, and track how behavior changes after each flow edit.</p>
            <p>Execution history is ordered for fast triage during campaigns.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="interactive-lift border-primary/30">
          <CardHeader>
            <Badge className="w-fit">Launch path</Badge>
            <CardTitle className="font-[var(--font-display)] text-[1.3rem] tracking-[-0.02em]">Go from token to first flow in minutes</CardTitle>
            <CardDescription>Connect a bot, add a trigger, and publish your first automation.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/bots">Connect bot</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="interactive-lift">
          <CardHeader>
            <CardTitle className="font-[var(--font-display)] text-[1.3rem] tracking-[-0.02em]">What you get with Telegraph</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 md:grid-cols-2">
              <Feature text="Visual flow creation for message triggers" />
              <Feature text="Condition branches with Telegram actions" />
              <Feature text="Execution tracking with action status" />
              <Feature text="Plan-aware limits for production teams" />
            </ul>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
