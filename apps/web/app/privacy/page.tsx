import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/components/legal/LegalDocument";
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
    <LegalDocument
      title="Privacy policy"
      subtitle="How Telegraph handles account data, workflow records, and Telegram bot credentials."
      effectiveDate="April 3, 2026"
      summary={
        <p>
          This policy explains what data Telegraph processes when you create an
          account, connect Telegram bots, publish workflows, and review run
          history. It is written to match the current application architecture:
          Clerk for authentication, Creem for billing, PostgreSQL for
          application data, Redis-backed job processing, encrypted bot tokens,
          and Telegram webhook intake.
        </p>
      }
    >
      <LegalSection title="Information we collect">
        <p>
          Telegraph collects the information needed to operate your workspace and
          execute Telegram automations.
        </p>
        <LegalList
          items={[
            "Account information such as your Clerk user identifier, email address when available, and organization or workspace context.",
            "Subscription and billing mirror data such as plan, status, current period end, and billing identifiers returned by Creem.",
            "Connected bot data such as Telegram bot ID, username, display name, and the bot token you submit. Bot tokens are stored encrypted at rest.",
            "Workflow content such as flow definitions, conditions, actions, template drafts, and published template versions you create in the app.",
            "Execution data such as incoming Telegram update payloads, workflow runs, action runs, error states, and related timestamps.",
            "Operational telemetry such as request metadata, application logs, and error reports used to keep the service secure and reliable.",
          ]}
        />
      </LegalSection>

      <LegalSection title="How we use information">
        <p>
          We use information to authenticate users, provision accounts, connect and
          verify Telegram bots, store workflow definitions, process webhook events,
          execute queued actions, enforce plan limits, troubleshoot incidents, and
          improve the safety and reliability of the service.
        </p>
        <p>
          We also use data to maintain auditability inside the product, including
          run history and failure records that help you understand what your bot did
          and why.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and similar technologies">
        <p>
          Telegraph currently relies on essential authentication, session, and
          security technologies needed to sign users in and keep the app working.
          That includes cookies or similar storage used by Clerk and by the app
          itself.
        </p>
        <p>
          Telegraph keeps third-party product analytics disabled by default. If
          an analytics tool such as Contentsquare is enabled in production, the
          app requires an explicit consent choice before loading it. Telegraph
          does not currently run advertising cookies or third-party behavioral
          marketing trackers. If that changes, this policy and the{" "}
          <Link
            className="text-primary underline underline-offset-4"
            href="/cookies"
          >
            cookie policy
          </Link>{" "}
          should be updated.
        </p>
      </LegalSection>

      <LegalSection title="How information is shared">
        <p>
          Telegraph shares information only when needed to provide the service or
          comply with the law.
        </p>
        <LegalList
          items={[
            "With infrastructure and software providers that power authentication, billing, hosting, database storage, queue processing, and error monitoring.",
            "With Telegram when Telegraph calls the Telegram Bot API on your behalf to validate a bot, set a webhook, or execute workflow actions.",
            "With professional advisers, regulators, or law enforcement when disclosure is reasonably necessary for compliance, fraud prevention, or protection of rights and safety.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <p>
          Telegraph keeps account, bot, workflow, and execution data for as long as
          it is reasonably necessary to operate your workspace, maintain records,
          and protect the service. If you request account deletion, Telegraph should
          delete or de-identify the application data associated with your workspace,
          subject to limited retention for backups, fraud prevention, legal
          compliance, or dispute resolution.
        </p>
        <p>
          Deleting your account or connected bots may stop active workflows and
          prevent future Telegram actions from running.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Telegraph uses reasonable technical and organizational safeguards designed
          to protect personal and workspace data. Examples in the current product
          include encrypted Telegram bot tokens at rest, authenticated access to
          protected product areas, and operational monitoring for failures and abuse.
        </p>
        <p>
          No online system is perfectly secure, so Telegraph cannot guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection title="International data transfers">
        <p>
          Telegraph and its service providers may process data in countries other
          than the country where you or your end users are located. By using the
          service, you authorize those transfers to the extent permitted by
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can usually access or update core account information from your
          Telegraph account settings and billing provider flows. You remain
          responsible for the Telegram bot content, user data, and automations you
          choose to process through the service.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          Telegraph may update this policy from time to time. When that happens, the
          effective date above should be revised and the updated version will apply
          going forward.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
