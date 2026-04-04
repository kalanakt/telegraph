import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { LandingFlowPreviewClient } from "@/components/marketing/LandingFlowPreviewClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthUserId } from "@/lib/clerk-auth";
import { toAbsoluteUrl } from "@/lib/site-url";

const productCards = [
  {
    title: "Design Telegram bot logic your team can review",
    description:
      "Map triggers, conditions, and actions on a visual canvas so product, ops, and engineering can work from the same source of truth.",
    points: [
      "Replace scattered scripts with a workflow your team can actually read",
      "Launch new automation logic without rebuilding backend plumbing",
      "Reuse working flow patterns across bots and templates",
    ],
  },
  {
    title: "Run every Telegram update through a reliable pipeline",
    description:
      "Telegraph validates incoming updates, deduplicates events, and queues actions so production traffic stays predictable.",
    points: [
      "Webhook normalization before flows execute",
      "Idempotent processing to prevent duplicate actions",
      "Queue-backed execution with recorded workflow and action runs",
    ],
  },
  {
    title: "Fix issues without reconstructing runs from logs",
    description:
      "See what matched, what action fired, and where a run failed so your team can improve workflows with confidence.",
    points: [
      "Action-by-action visibility for every run",
      "Faster incident review for support and ops teams",
      "One workspace for bots, flows, and execution history",
    ],
  },
] as const;

const useCases = [
  {
    title: "Lead capture and qualification",
    description:
      "Turn high-intent Telegram chats into qualified leads before they cool off.",
    recipe: [
      'Trigger when a prospect asks about "pricing" or a "demo"',
      "Send the right next step instantly",
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
    title: "Community ops and moderation",
    description:
      "Automate onboarding and moderation without babysitting every group.",
    recipe: [
      "Trigger on joins, keywords, or callback actions",
      "Branch on member status, intent, or group rules",
      "Send welcomes, approvals, or moderation actions automatically",
    ],
  },
] as const;

const processSteps = [
  {
    step: "01",
    title: "Connect one Telegram bot",
    description:
      "Add your bot token, point the webhook at Telegraph, and keep setup in one place instead of spreading it across custom services.",
  },
  {
    step: "02",
    title: "Build the workflow visually",
    description:
      "Map triggers, conditions, and actions for replies, routing, lead capture, support triage, and internal alerts in a builder your team can review.",
  },
  {
    step: "03",
    title: "Launch with run-by-run visibility",
    description:
      "Every Telegram update is validated, deduplicated, queued, and recorded so you can see what happened when a workflow succeeds or fails.",
  },
] as const;

const faqItems = [
  {
    question: "What is Telegraph?",
    answer:
      "Telegraph is a Telegram bot builder for teams that want a visual flow editor, queue-backed execution, and run history in one workspace.",
  },
  {
    question: "Do I need to write code to build a Telegram bot workflow?",
    answer:
      "No. Telegraph is designed so product, ops, and engineering teams can build and review Telegram workflows visually, while still keeping the execution model reliable enough for production use.",
  },
  {
    question: "How does Telegraph help with production reliability?",
    answer:
      "Telegraph validates incoming Telegram updates, deduplicates events, queues actions for execution, and records workflow and action runs so your team can diagnose failures quickly.",
  },
  {
    question: "What can I automate with a Telegram bot in Telegraph?",
    answer:
      "Teams use Telegraph for lead qualification, support triage, community moderation, onboarding flows, routing, and internal operational alerts triggered by Telegram activity.",
  },
  {
    question: "Can I start with one bot and expand later?",
    answer:
      "Yes. You can start by connecting one Telegram bot, publish your first flow, and expand your workflows as your team adds more automation use cases.",
  },
] as const;

export const metadata: Metadata = {
  title: "Telegram Bot Builder for Automation Teams | Telegraph",
  description:
    "Build Telegram bot workflows in a visual editor, run them through a queue-backed execution pipeline, and review every run in one workspace.",
  keywords: [
    "telegram bot builder",
    "telegram automation",
    "telegram flow editor",
    "telegram workflow builder",
    "telegram bot workflow",
    "telegram bot automation platform",
    "visual telegram bot builder",
    "telegram bot workflow software",
    "telegram bot platform",
    "telegram support bot",
    "telegram lead qualification",
  ],
  alternates: {
    canonical: toAbsoluteUrl("/"),
  },
  openGraph: {
    title: "Telegram Bot Builder for Automation Teams | Telegraph",
    description:
      "Build Telegram replies, routing, support, and ops workflows visually, then run and debug them from one workspace.",
    url: toAbsoluteUrl("/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telegram Bot Builder for Automation Teams | Telegraph",
    description:
      "Visual Telegram automation with reliable execution, clearer ownership, and full run history.",
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
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Telegraph",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: toAbsoluteUrl("/"),
        description:
          "Telegraph is a Telegram bot builder with a visual flow editor, queue-backed execution, and run history for modern teams.",
        featureList: [
          "Visual flow editor for Telegram bots",
          "Telegram webhook automation",
          "Queue-backed execution",
          "Bot run history",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="flex flex-col gap-12 pb-16 pt-2 md:gap-20 md:pt-4">
        <section className="surface-panel overflow-hidden p-0">
          <div className="landing-grid-surface relative isolate flex border border-border/0 md:min-h-[620px]">
            <div className="absolute inset-0 hidden md:block">
              <LandingFlowPreviewClient />
            </div>

            <div className="relative z-10 flex min-h-[420px] w-full flex-1 items-center px-4 py-8 sm:px-6 sm:py-10 md:min-h-[620px] md:items-end md:px-10 md:py-10">
              <div className="landing-hero-copy flex w-full max-w-md flex-col gap-4 border-0 bg-transparent p-0 backdrop-blur-0 sm:max-w-2xl md:max-w-6xl md:flex-1 md:gap-5 md:border md:border-border/70 md:bg-background/20 md:p-8 md:backdrop-blur-sm">
                <Badge
                  variant="secondary"
                  className="w-fit text-wrap hidden sm:flex"
                >
                  Telegram bot builder for support, lead routing, and ops
                </Badge>

                <h1
                  className="max-w-3xl text-2xl font-semibold text-foreground sm:max-w-xl sm:text-5xl md:max-w-none md:text-7xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Build Telegram Bot Automations Without Rewriting Backend Glue.
                </h1>

                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:max-w-[48ch] sm:text-base sm:leading-7 md:max-w-[58ch] md:text-lg md:leading-8">
                  Telegraph gives your team a visual flow editor, Telegram
                  webhook intake, queue-backed execution, and run history in one
                  workspace so you can launch faster and debug with confidence.
                </p>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
                  <span className="section-chip">lead capture</span>
                  <span className="section-chip">support triage</span>
                  <span className="section-chip">community ops</span>
                  <span className="section-chip">ops alerts</span>
                </div>

                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/sign-up">
                      Create my first Telegram flow
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Link href="/pricing">See plans</Link>
                  </Button>
                </div>

                <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-secondary" />
                    Visual builder your team can review
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-secondary" />
                    Queue-backed execution
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-secondary" />
                    Run history for every workflow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="surface-panel flex flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-4">
              <Badge variant="outline" className="w-fit">
                Why teams switch
              </Badge>
              <h2
                className="max-w-[13ch] text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                A Telegram bot builder for teams switching from scripts.
              </h2>
              <p className="max-w-[56ch] text-base leading-7 text-muted-foreground">
                Most Telegram automations begin as quick scripts, then become
                harder to change, review, and debug. Telegraph keeps flow
                design, execution, and run history in one place so product, ops,
                and engineering can ship faster without losing control of how
                the bot behaves.
              </p>
            </div>

            <FeatureList
              items={[
                "Replace brittle bot changes with a visual flow your team can review",
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

        <section className="surface-panel flex flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4">
            <Badge variant="outline" className="w-fit">
              How it works
            </Badge>
            <h2
              className="max-w-3xl text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              How Telegraph handles Telegram bot automation.
            </h2>
            <p className="max-w-[72ch] text-base leading-7 text-muted-foreground">
              From the first Telegram message to the final action, Telegraph is
              built to make workflow logic easier to launch and easier to debug.
              Your team gets a faster path to production without giving up
              operational visibility.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step) => (
              <Card key={step.step}>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    Step {step.step}
                  </Badge>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Badge variant="outline" className="w-fit">
              Use cases
            </Badge>
            <h2
              className="max-w-3xl text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What teams automate with Telegraph.
            </h2>
            <p className="max-w-[72ch] text-base leading-7 text-muted-foreground">
              High-converting homepages remove ambiguity. These examples show
              the kinds of Telegram workflows teams usually want to launch
              first.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
          </div>
        </section>

        <section className="surface-panel flex flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4">
            <Badge variant="outline" className="w-fit">
              FAQ
            </Badge>
            <h2
              className="max-w-3xl text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Answers teams ask before they move bot logic into Telegraph.
            </h2>
            <p className="max-w-[68ch] text-base leading-7 text-muted-foreground">
              The biggest objections are usually about flexibility, reliability,
              and whether a team can actually manage bot workflows together.
              These are the questions the homepage should answer clearly.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.question}>
                <CardHeader>
                  <CardTitle>{item.question}</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {item.answer}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="surface-panel overflow-hidden p-0">
          <div className="landing-grid-surface grid gap-6 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="flex flex-col gap-4">
              <Badge variant="secondary" className="w-fit">
                Start with one bot
              </Badge>
              <h2
                className="max-w-3xl text-3xl font-semibold text-foreground md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Launch your first Telegram workflow with a clearer path to
                production.
              </h2>
              <p className="max-w-6xl text-base leading-7 text-muted-foreground">
                Connect a bot, publish one flow, and give your team a cleaner
                way to automate replies, routing, support, and operations in
                Telegram.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/sign-up">
                  Create my first Telegram flow
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
