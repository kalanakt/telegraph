import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LandingFlowPreview } from "@/components/marketing/LandingFlowPreview";
import { getAuthUserId } from "@/lib/clerk-auth";
import { toAbsoluteUrl } from "@/lib/site-url";

const productCards = [
  {
    title: "Design flows without losing the logic",
    description:
      "Model triggers, branches, and actions visually instead of stitching together brittle scripts.",
    points: [
      "Keep routing logic legible for support, ops, and product",
      "Update workflows faster when your bot behavior changes",
      "Reuse the same builder language across templates and live flows",
    ],
  },
  {
    title: "Run Telegram automations with operational guardrails",
    description:
      "Telegraph validates updates, deduplicates events, and hands off work to workers built for reliable delivery.",
    points: [
      "Webhook intake and normalization",
      "Idempotent event processing",
      "Queued action execution with run records",
    ],
  },
  {
    title: "Debug real conversations, not just diagrams",
    description:
      "When a bot misfires, you can inspect what matched, what ran, and what needs to change next.",
    points: [
      "Action-by-action visibility",
      "Faster support and incident review",
      "Bot controls and execution history in one workspace",
    ],
  },
] as const;

const useCases = [
  {
    title: "Lead qualification",
    description:
      "Catch intent in Telegram, reply instantly, and hand warm conversations to your team.",
    recipe: [
      "Trigger on inbound message",
      'Branch on keywords like "pricing" or "demo"',
      "Notify sales with the full chat context",
    ],
  },
  {
    title: "Support automation",
    description:
      "Route repetitive questions into fast replies while keeping a clean path for human follow-up.",
    recipe: [
      "Match common support intents",
      "Send help content or recovery steps",
      "Escalate edge cases to an operator flow",
    ],
  },
  {
    title: "Community operations",
    description:
      "Moderate groups, welcome members, and enforce lightweight policies without manual busywork.",
    recipe: [
      "Trigger on joins, reactions, or callbacks",
      "Apply branch rules for member status and context",
      "Send updates, approvals, or moderation actions automatically",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Telegraph | Telegram Bot Builder with a Visual Flow Editor",
  description:
    "Telegraph is a Telegram bot builder for teams that want a visual flow editor, reliable webhook processing, and clear run history in one place.",
  keywords: [
    "telegram bot builder",
    "telegram automation",
    "telegram flow editor",
    "telegram workflow builder",
    "telegram bot automation platform",
    "visual telegram bot builder",
    "telegram bot workflow software",
    "telegram bot platform",
  ],
  alternates: {
    canonical: toAbsoluteUrl("/"),
  },
  openGraph: {
    title: "Telegraph | Telegram Bot Builder with a Visual Flow Editor",
    description:
      "Design Telegram bot workflows visually, process webhook traffic reliably, and review every run from one workspace.",
    url: toAbsoluteUrl("/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telegraph | Telegram Bot Builder with a Visual Flow Editor",
    description:
      "Visual Telegram automation with reliable execution and clear run history.",
  },
};

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
        >
          <CheckCircle2 className="mt-1 size-4 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function HomePage() {
  const userId = await getAuthUserId();
  if (userId) {
    redirect("/dashboard");
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Telegraph",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: toAbsoluteUrl("/"),
    description:
      "Telegraph is a Telegram bot builder with a visual flow editor, reliable execution, and run history for modern teams.",
    featureList: [
      "Visual flow editor for Telegram bots",
      "Telegram webhook automation",
      "Queue-backed execution",
      "Bot run history",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="flex flex-col gap-16 pb-16 pt-4 md:gap-20">
        <section className="surface-panel overflow-hidden p-0">
          <div className="landing-grid-surface relative isolate min-h-[620px] border border-border/0">
            <LandingFlowPreview />

            <div className="relative z-10 flex min-h-[620px] items-end px-6 py-6 md:px-10 md:py-10">
              <div className="flex max-w-2xl flex-col gap-5 md:p-8">
                <Badge variant="secondary" className="w-fit">
                  Telegram bot builder for modern teams
                </Badge>

                <h1
                  className="max-w-xl text-5xl font-semibold text-foreground md:text-7xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Build Telegram automations inside a real flow canvas.
                </h1>

                <p className="max-w-[58ch] text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                  Telegraph gives teams a visual builder for Telegram triggers,
                  conditions, and actions, then runs those workflows through a
                  reliable execution pipeline with clear history after launch.
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="section-chip">support flows</span>
                  <span className="section-chip">lead routing</span>
                  <span className="section-chip">community ops</span>
                  <span className="section-chip">message automation</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/sign-up">
                      Start free
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/pricing">View pricing</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="surface-panel flex flex-col gap-6 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-4">
              <Badge variant="outline" className="w-fit">
                Product-led landing page
              </Badge>
              <h2
                className="max-w-[13ch] text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Show the actual builder, not just a promise.
              </h2>
              <p className="max-w-[56ch] text-base leading-7 text-muted-foreground">
                The homepage now leans into the sharp, structured style already
                used throughout Telegraph and puts a believable flow canvas in
                front of visitors immediately.
              </p>
            </div>

            <FeatureList
              items={[
                "Sharper hierarchy that matches the dashboard and builder surfaces",
                "A live-looking mock flow that explains the product in seconds",
                "More concrete examples of what teams can automate in Telegram",
              ]}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {productCards.map((card, index) => (
              <Card
                key={card.title}
                className={index === 2 ? "md:col-span-2" : ""}
              >
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureList items={card.points} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {useCases.map((useCase) => (
            <Card key={useCase.title}>
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  Example workflow
                </Badge>
                <CardTitle>{useCase.title}</CardTitle>
                <CardDescription>{useCase.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureList items={useCase.recipe} />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="surface-panel overflow-hidden p-0">
          <div className="landing-grid-surface grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="flex flex-col gap-4">
              <Badge variant="secondary" className="w-fit">
                Ready to start
              </Badge>
              <h2
                className="max-w-md text-3xl font-semibold text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Launch your next Telegram workflow in Telegraph.
              </h2>
              <p className="max-w-6xl text-base leading-7 text-muted-foreground">
                Start with one bot, one flow, and a clearer path from inbound
                message to finished action.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start free
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/blog">Read the blog</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
