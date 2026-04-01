import type { Metadata } from "next";
import { PageHeading } from "@/components/PageHeading";
import { toAbsoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Terms of Service | Telegraph",
  description:
    "Read the terms for using Telegraph to build, run, and manage Telegram bot automations.",
  alternates: {
    canonical: toAbsoluteUrl("/terms"),
  },
  openGraph: {
    title: "Terms of Service | Telegraph",
    description:
      "Read the terms for using Telegraph to build, run, and manage Telegram bot automations.",
    url: toAbsoluteUrl("/terms"),
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Terms of service"
        subtitle="Terms for using Telegraph to build, run, and manage Telegram bot automations."
      />
      <section className="surface-panel space-y-3 p-6 text-sm text-muted-foreground">
        <p>
          Telegraph is provided as a software service for building and
          operating Telegram bot workflows.
        </p>
        <p>
          You are responsible for your bot behavior, message content, connected
          accounts, and compliance with Telegram platform policies.
        </p>
        <p>
          We may enforce plan limits and usage controls to protect platform
          reliability, security, and service availability.
        </p>
      </section>
    </div>
  );
}
