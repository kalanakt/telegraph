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
import { getAuthUserId } from "@/lib/clerk-auth";
import { toAbsoluteUrl } from "@/lib/site-url";

const heroHighlights = [
  "Visual workflow builder",
  "Telegram automation",
  "Run history",
] as const;

const features = [
  {
    title: "Visual Telegram workflow builder",
    description:
      "Build Telegram bot flows with triggers, conditions, and actions in one clear workspace.",
    points: [
      "Drag-and-drop workflow editing",
      "Readable bot logic for teams",
      "Faster changes without custom scripts",
    ],
  },
  {
    title: "Reliable Telegram automation",
    description:
      "Receive Telegram updates, validate events, and queue actions before messages are sent.",
    points: [
      "Built-in Telegram webhook handling",
      "Idempotent event processing",
      "Queue-backed worker execution",
    ],
  },
  {
    title: "Bot runs and operation history",
    description:
      "Track every Telegram bot run from trigger to action so support and debugging stay simple.",
    points: [
      "Action timelines for every run",
      "Faster failure review",
      "Bot controls in the same product",
    ],
  },
] as const;

const steps = [
  {
    title: "Connect a bot",
    description:
      "Add your bot, connect the webhook, and keep token handling inside the app.",
  },
  {
    title: "Build the automation",
    description:
      "Set up triggers, conditions, and message actions in the visual workflow builder.",
  },
  {
    title: "Launch and monitor",
    description:
      "Run queued actions, inspect results, and review what happened in every workflow run.",
  },
] as const;

export const metadata: Metadata = {
  title: "Telegram Bot Builder and Automation Platform",
  description:
    "Telegraph is a Telegram bot builder for visual workflows, webhook automation, queue-backed execution, and bot run history.",
  keywords: [
    "telegram bot builder",
    "telegram automation",
    "telegram workflow builder",
    "telegram bot automation platform",
    "visual telegram bot builder",
    "telegram bot workflow software",
  ],
  alternates: {
    canonical: toAbsoluteUrl("/"),
  },
  openGraph: {
    title: "Telegraph | Telegram bot builder and automation platform",
    description:
      "Design Telegram workflows visually, process webhook traffic reliably, and review every run from one workspace.",
    url: toAbsoluteUrl("/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telegraph | Telegram Bot Builder and Automation Platform",
    description:
      "Visual Telegram automation with queue-backed execution and clear run history.",
  },
};

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-sm text-muted-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 text-primary" />
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
      "Telegraph is a Telegram bot builder for visual workflows, Telegram automation, queue-backed execution, and bot run history.",
    featureList: [
      "Telegram bot workflow builder",
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
        <section className="surface-panel px-6 py-8 md:px-10 md:py-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-start">
            <div className="flex flex-col gap-6">
              <Badge variant="secondary" className="w-fit">
                Telegram bot builder
              </Badge>

              <div className="flex flex-col gap-4">
                <h1
                  className="max-w-[10ch] text-4xl font-semibold text-foreground md:text-6xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Telegram bot builder.
                </h1>
                <p className="max-w-[60ch] text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                  Build Telegram automation with a visual workflow builder,
                  queue-backed execution, and clear run history from one
                  workspace.
                </p>
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

              <div className="grid gap-3 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-sm bg-muted/50 px-4 py-4 text-sm font-medium text-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  How it works
                </Badge>
                <CardTitle>From Telegram update to delivered action.</CardTitle>
                <CardDescription>
                  Capture Telegram webhook events, match the right workflow, and
                  store the full result.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureList
                  items={[
                    "Receive the Telegram update",
                    "Create queued workflow actions",
                    "Send the response and save the run",
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureList items={feature.points} />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <Badge variant="secondary" className="w-fit">
              From setup to operations
            </Badge>
            <h2
              className="max-w-[13ch] text-3xl font-semibold text-foreground md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Telegram automation that stays easy to manage.
            </h2>
            <p className="max-w-[58ch] text-base leading-7 text-muted-foreground">
              Telegraph keeps workflow design, message handling, and run
              visibility in one place so teams can launch faster and support
              bots with less friction.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <Card key={step.title}>
                <CardHeader className="gap-3">
                  <Badge variant="outline" className="w-fit">
                    Step {index + 1}
                  </Badge>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="surface-panel px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4">
              <Badge variant="secondary" className="w-fit">
                Ready to start
              </Badge>
              <div className="flex flex-col gap-3">
                <h2
                  className="max-w-[14ch] text-3xl font-semibold text-foreground md:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Start your Telegram bot automation.
                </h2>
                <p className="max-w-[56ch] text-base leading-7 text-muted-foreground">
                  Connect your bot, build the workflow, and launch with clear
                  run history.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start free
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/blog">Read the blog</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
