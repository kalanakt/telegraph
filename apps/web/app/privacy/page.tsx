import type { Metadata } from "next";
import { PageHeading } from "@/components/PageHeading";
import { toAbsoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Privacy Policy | Telegraph",
  description:
    "Learn how Telegraph stores account data, workflow records, and encrypted bot credentials for Telegram automation.",
  alternates: {
    canonical: toAbsoluteUrl("/privacy"),
  },
  openGraph: {
    title: "Privacy Policy | Telegraph",
    description:
      "Learn how Telegraph stores account data, workflow records, and encrypted bot credentials for Telegram automation.",
    url: toAbsoluteUrl("/privacy"),
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Privacy policy"
        subtitle="How Telegraph handles account data, workflow records, and Telegram bot credentials."
      />
      <section className="surface-panel space-y-3 p-6 text-sm text-muted-foreground">
        <p>
          Telegraph stores the account, bot, and workflow data needed to run
          your Telegram automations and show execution history inside the app.
        </p>
        <p>
          Bot tokens are encrypted at rest and only used for Telegram API
          operations triggered by your connected workflows.
        </p>
        <p>
          You can request account deletion at any time to remove stored
          application data associated with your workspace.
        </p>
      </section>
    </div>
  );
}
