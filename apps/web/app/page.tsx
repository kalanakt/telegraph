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
  "Visual flow editor",
  "Telegram webhook automation",
  "Run history",
] as const;

const features = [
  {
    title: "Build flows in a visual editor",
    description:
      "Map Telegram triggers, conditions, and actions in a workspace your whole team can read.",
    points: [
      "Design automation logic faster",
      "Keep bot behavior easy to review",
      "Update flows without chasing custom scripts",
    ],
  },
  {
    title: "Run every workflow reliably",
    description:
      "Telegraph receives updates, evaluates matching rules, and pushes actions through a queue-backed execution pipeline.",
    points: [
      "Webhook intake and event validation",
      "Idempotent processing for repeat safety",
      "Worker-backed delivery and retries",
    ],
  },
  {
    title: "Monitor every bot run",
    description:
      "Follow each workflow from trigger to action so support, ops, and engineering can debug with confidence.",
    points: [
      "Action-by-action run timelines",
      "Faster incident reviews",
      "Bot controls and history together",
    ],
  },
] as const;

const steps = [
  {
    title: "Connect your bot",
    description:
      "Add a bot token, register the webhook, and keep credentials encrypted at rest.",
  },
  {
    title: "Build the flow",
    description:
      "Use the flow editor to connect triggers, conditions, and actions for the path you want to automate.",
  },
  {
    title: "Go live with confidence",
    description:
      "Launch the workflow, monitor runs, and see exactly how each update was handled.",
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
        <section className="surface-panel px-6 py-8 md:px-10 md:py-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-start">
            <div className="flex flex-col gap-6">
              <Badge variant="secondary" className="w-fit">
                Telegram bot builder for modern teams
              </Badge>

              <div className="flex flex-col gap-4">
                <h1
                  className="max-w-[10ch] text-4xl font-semibold text-foreground md:text-6xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Telegram bot builder with a visual flow editor.
                </h1>
                <p className="max-w-[60ch] text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                  Design Telegram automations, process updates reliably, and
                  review every run from one workspace built for teams.
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
                <CardTitle>From Telegram update to completed run.</CardTitle>
                <CardDescription>
                  Telegraph captures the event, matches the right flow, queues
                  the work, and stores the result for review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureList
                  items={[
                    "Receive the Telegram event",
                    "Evaluate the matching flow",
                    "Run the action and save the outcome",
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
              Built for teams
            </Badge>
            <h2
              className="max-w-[13ch] text-3xl font-semibold text-foreground md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              A Telegram automation platform your team can actually manage.
            </h2>
            <p className="max-w-[58ch] text-base leading-7 text-muted-foreground">
              Keep flow design, webhook handling, and run visibility in one
              product so shipping, support, and iteration stay simple.
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
                  Launch your next Telegram workflow in Telegraph.
                </h2>
                <p className="max-w-[56ch] text-base leading-7 text-muted-foreground">
                  Start with one bot, one flow, and a clear view of every run.
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
