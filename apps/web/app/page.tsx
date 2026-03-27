import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { getAuthUserId } from "@/lib/clerk-auth";

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 rounded-sm border border-border/70 bg-background/70 px-3.5 py-3 text-sm text-muted-foreground">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary/12 text-primary">
        <CheckCircle2 className="size-4" />
      </span>
      <span>{text}</span>
    </li>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="metric-tile flex flex-col gap-1.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="text-[1.8rem] font-semibold leading-none tracking-[-0.05em]">{value}</p>
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
    <div className="flex flex-col gap-8 pb-6 pt-2 md:gap-10">
      <section className="surface-panel relative overflow-hidden px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-16 h-56 w-56 rounded-full bg-accent/90 blur-3xl" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="flex max-w-3xl flex-col gap-5">
            <Badge variant="outline" className="w-fit">
              Telegram automation
            </Badge>

            <div className="flex flex-col gap-3">
              <h1
                className="text-4xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-[4rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Build Telegram flows fast.
              </h1>

              <p className="max-w-[52ch] text-base leading-7 text-muted-foreground">
                Telegraph gives you a visual builder, queued execution, and clear run history in one workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start free
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">Pricing</Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-[1.2rem] tracking-[-0.03em]">
                Simple by default
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Stat label="Setup" value="<10 min" />
              <Stat label="Builder" value="Visual" />
              <Stat label="Runs" value="Tracked" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-[var(--font-display)]">Build</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              <Feature text="Triggers, conditions, and actions." />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-[var(--font-display)]">Run</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              <Feature text="Queue-backed execution for reliable delivery." />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-[var(--font-display)]">Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              <Feature text="Clear run history when something fails." />
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
