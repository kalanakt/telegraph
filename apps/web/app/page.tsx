import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { getAuthUserId } from "@/lib/clerk-auth";

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/70 px-3.5 py-3 text-sm text-muted-foreground">
      <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-primary/12 text-primary">
        <CheckCircle2 className="size-4" />
      </span>
      <span>{text}</span>
    </li>
  );
}

function Metric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric-tile flex flex-col gap-2">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="text-[1.9rem] font-semibold leading-none tracking-[-0.05em]">
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export default async function HomePage() {
  if (isClerkConfigured()) {
    const userId = await getAuthUserId();
    if (userId) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex flex-col gap-14 pb-6 pt-2 md:gap-16">
      <section className="surface-panel relative overflow-hidden px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-16 h-56 w-56 rounded-full bg-accent/90 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div className="flex max-w-3xl flex-col gap-6">
            <Badge variant="outline" className="w-fit">
              Queue-backed operations for Telegram teams
            </Badge>

            <div className="flex flex-col gap-4">
              <h1
                className="text-4xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-[4.35rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Run Telegram automations with the calm, clarity, and control a real SaaS product needs.
              </h1>

              <p className="max-w-[60ch] text-base leading-7 text-muted-foreground md:text-[1.05rem]">
                Telegraph combines a visual builder, durable queue processing, and execution tracing so your bot workflows stay readable for builders and dependable for operators.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Feature text="Design trigger, condition, and action chains without losing the big picture." />
              <Feature text="Track run health with per-step visibility instead of guesswork and log diving." />
              <Feature text="Move from test traffic to campaign volume without rebuilding your backend path." />
              <Feature text="Give operators a cleaner control surface for bots, builders, and run history." />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start building
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="interactive-lift">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  Operations pulse
                </Badge>
                <CardTitle className="font-[var(--font-display)] text-[1.32rem] tracking-[-0.03em]">
                  Recent account snapshot
                </CardTitle>
                <CardDescription>
                  A representative workload from teams running support, broadcast, and response flows.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Metric label="Median run success" value="97.4%" detail="Stable across multi-step workflows." />
                <Metric label="Runs this week" value="14,280" detail="Healthy volume without queue drift." />
                <Metric label="Average processing" value="218ms" detail="Fast enough for conversational flows." />
              </CardContent>
            </Card>

            <Card className="interactive-lift">
              <CardHeader>
                <CardTitle className="font-[var(--font-display)] text-[1.08rem] tracking-[-0.03em]">
                  What teams ship faster
                </CardTitle>
                <CardDescription>
                  Cleaner builder surfaces make adoption easier across product, ops, and support teams.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="metric-tile">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Fewer handoffs
                  </p>
                  <p className="text-sm leading-6 text-foreground/90">
                    Builders can publish common flows without waiting on worker-level implementation changes.
                  </p>
                </div>
                <div className="metric-tile">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Better visibility
                  </p>
                  <p className="text-sm leading-6 text-foreground/90">
                    Run history becomes a tool for operators, not just the engineering team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <Card className="interactive-lift">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Builder studio
            </Badge>
            <CardTitle className="font-[var(--font-display)] text-[1.42rem] tracking-[-0.03em]">
              Design flows visually and keep the logic readable.
            </CardTitle>
            <CardDescription>
              The builder stays approachable for fast edits while still supporting the branching patterns teams need in production.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="grid gap-3 sm:grid-cols-2">
              <Feature text="Message, command, callback, and inline triggers" />
              <Feature text="True and false branching for condition nodes" />
              <Feature text="Action presets for Telegram-native operations" />
              <Feature text="Validation before every save and publish" />
            </ul>

            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Node clarity" value="14%" detail="Less visual density after spacing and border tuning." />
              <Metric label="Review speed" value="2.3x" detail="Faster for teammates checking live automation changes." />
              <Metric label="Setup time" value="<10m" detail="From bot token to first published builder." />
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-lift">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Run visibility
            </Badge>
            <CardTitle className="font-[var(--font-display)] text-[1.3rem] tracking-[-0.03em]">
              Observe every run without drowning in noise.
            </CardTitle>
            <CardDescription>
              Status, timing, and failure context are grouped into a surface that feels operational instead of improvised.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Triage flow
              </p>
              <p className="leading-6">
                Inspect failures by action type, compare runs after builder edits, and retry without losing context.
              </p>
            </div>
            <div className="metric-tile">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Campaign confidence
              </p>
              <p className="leading-6">
                Execution history stays readable during spikes, which makes incident review and operator handoff much calmer.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="interactive-lift">
          <CardHeader>
            <Badge className="w-fit">Launch path</Badge>
            <CardTitle className="font-[var(--font-display)] text-[1.32rem] tracking-[-0.03em]">
              Go from token to first builder in minutes.
            </CardTitle>
            <CardDescription>
              Connect a bot, choose a trigger, and publish the first reliable flow without wrestling the UI.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="1" value="Connect" detail="Store your BotFather token and webhook path." />
              <Metric label="2" value="Design" detail="Assemble the first trigger-condition-action path." />
              <Metric label="3" value="Publish" detail="Push live with a surface your team can revisit later." />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/sign-up">Create account</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/bots">Connect bot</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-lift">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Product shape
            </Badge>
            <CardTitle className="font-[var(--font-display)] text-[1.32rem] tracking-[-0.03em]">
              What the improved SaaS shell gives your team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 md:grid-cols-2">
              <Feature text="Sharper visual hierarchy across navigation, cards, and content blocks." />
              <Feature text="Larger touch targets and calmer spacing on buttons and form fields." />
              <Feature text="Cleaner border system that reads as product polish, not template styling." />
              <Feature text="Consistent SaaS surfaces for dashboards, builders, and operations views." />
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
