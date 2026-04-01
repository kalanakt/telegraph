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
    title: "Build flows your whole team can understand",
    description:
      "Map triggers, conditions, and actions on a visual canvas so product, ops, and engineering can review the same workflow.",
    points: [
      "Replace scattered scripts with a shared source of truth",
      "Launch new automation logic without rewriting backend glue",
      "Reuse working flow patterns across bots and templates",
    ],
  },
  {
    title: "Run every message through a reliable pipeline",
    description:
      "Telegraph validates incoming updates, deduplicates events, and queues actions so production traffic stays predictable.",
    points: [
      "Webhook normalization before workflows execute",
      "Idempotent processing to avoid duplicate actions",
      "Queued execution with recorded workflow and action runs",
    ],
  },
  {
    title: "Fix issues without digging through raw logs",
    description:
      "See what matched, what action fired, and where a run failed so your team can improve workflows with confidence.",
    points: [
      "Action-by-action visibility for every run",
      "Faster support and incident review",
      "One workspace for bots, flows, and execution history",
    ],
  },
] as const;

const useCases = [
  {
    title: "Lead qualification",
    description:
      "Turn high-intent Telegram chats into qualified leads before they cool off.",
    recipe: [
      'Trigger when a prospect asks about "pricing" or a "demo"',
      "Send the right reply instantly",
      "Alert sales with the full conversation context",
    ],
  },
  {
    title: "Support triage",
    description:
      "Answer common questions immediately and escalate edge cases with context.",
    recipe: [
      "Match recurring intents like billing, setup, or access",
      "Send a helpful reply or next step",
      "Route complex conversations to a human owner",
    ],
  },
  {
    title: "Community operations",
    description:
      "Automate onboarding and moderation without babysitting every group.",
    recipe: [
      "Trigger on joins, keywords, or callback actions",
      "Branch on member status, intent, or group rules",
      "Send welcomes, approvals, or moderation actions automatically",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Telegraph | Visual Telegram Bot Builder for Production Teams",
  description:
    "Build Telegram bot workflows in a visual editor, run them through a reliable execution pipeline, and review every run in one workspace.",
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
    title: "Telegraph | Visual Telegram Bot Builder for Production Teams",
    description:
      "Build Telegram replies, routing, and ops workflows visually, then run and debug them from one workspace.",
    url: toAbsoluteUrl("/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telegraph | Visual Telegram Bot Builder for Production Teams",
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
          <CheckCircle2 className="mt-1 size-4 text-secondary" />
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
                  Telegram bot builder for teams that move fast
                </Badge>

                <h1
                  className="max-w-xl text-5xl font-semibold text-foreground md:text-7xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Launch Telegram bot workflows without another backend release.
                </h1>

                <p className="max-w-[58ch] text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                  Build replies, routing, and ops automations in a visual flow
                  editor. Telegraph handles Telegram webhook intake, queued
                  execution, and run history so your team can ship faster and
                  debug with confidence.
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="section-chip">lead qualification</span>
                  <span className="section-chip">support triage</span>
                  <span className="section-chip">community moderation</span>
                  <span className="section-chip">ops alerts</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/sign-up">
                      Build my first flow
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/pricing">See pricing</Link>
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
                Why teams switch
              </Badge>
              <h2
                className="max-w-[13ch] text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ship faster without losing control of your bot logic.
              </h2>
              <p className="max-w-[56ch] text-base leading-7 text-muted-foreground">
                Most Telegram automations begin as quick scripts, then become
                harder to change, review, and debug. Telegraph keeps flow
                design, execution, and run history in one workspace so product,
                ops, and engineering can work from the same source of truth.
              </p>
            </div>

            <FeatureList
              items={[
                "Replace brittle backend changes with a visual flow your team can review",
                "Publish new Telegram automation logic without rebuilding the same plumbing",
                "See what happened on every run when production behavior needs attention",
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
                Start with one bot
              </Badge>
              <h2
                className="max-w-md text-3xl font-semibold text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Create your first Telegram workflow today.
              </h2>
              <p className="max-w-6xl text-base leading-7 text-muted-foreground">
                Connect a bot, publish one flow, and give your team a cleaner
                way to automate replies, routing, and operations in Telegram.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Build my first flow
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
