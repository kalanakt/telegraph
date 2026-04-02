import type { Metadata } from "next";
import {
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/components/legal/LegalDocument";
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
    <LegalDocument
      title="Terms of service"
      subtitle="Terms for using Telegraph to build, run, and manage Telegram bot automations."
      effectiveDate="April 1, 2026"
      summary={
        <p>
          These terms govern access to Telegraph, a hosted workflow platform for
          creating Telegram bot automations with a visual builder, webhook
          processing, queued execution, templates, and run history.
        </p>
      }
    >
      <LegalSection title="Using Telegraph">
        <p>
          Telegraph is provided as a software service for building and
          operating Telegram bot workflows.
        </p>
        <p>
          By accessing or using Telegraph, you agree to these terms and to use the
          service only in compliance with applicable law and the rules of any
          third-party platforms you connect.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and eligibility">
        <p>
          You are responsible for maintaining the confidentiality of your account,
          organization access, API credentials, and connected Telegram bot tokens.
          You must ensure that the information you provide is accurate and that only
          authorized users access your workspace.
        </p>
      </LegalSection>

      <LegalSection title="Your responsibilities">
        <p>
          You are responsible for your bot behavior, message content, connected
          accounts, workflow logic, and compliance with Telegram platform policies.
        </p>
        <LegalList
          items={[
            "You must have the right to use the Telegram bots, channels, chats, and data you connect to Telegraph.",
            "You must obtain any notices or consents required for the messages, automations, or user data processed through your workflows.",
            "You must review and test your workflows before using them in production, especially when they send automated messages or trigger customer-facing actions.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You may not use Telegraph to:</p>
        <LegalList
          items={[
            "Send unlawful, deceptive, abusive, harassing, or spam content.",
            "Attempt to disrupt, probe, overload, or reverse engineer the service except as permitted by law.",
            "Circumvent plan limits, authentication controls, or platform safeguards.",
            "Store or process data through Telegraph when you do not have the right to do so.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Telegraph depends on third-party services such as Telegram, Clerk,
          Creem, hosting providers, database infrastructure, queue
          infrastructure, and monitoring providers. Your use of connected
          services may also be governed by the terms and policies of those third
          parties.
        </p>
      </LegalSection>

      <LegalSection title="Plans, billing, and limits">
        <p>
          Certain features may require a paid plan. Telegraph may enforce plan
          limits, execution limits, bot limits, workflow limits, or usage controls
          to protect platform reliability, security, and service availability.
        </p>
        <p>
          If you purchase a paid subscription, billing is handled through the
          configured billing provider. You are responsible for keeping payment
          details current and for reviewing the provider’s billing terms, renewal
          flows, and cancellation settings.
        </p>
      </LegalSection>

      <LegalSection title="Customer content">
        <p>
          You retain ownership of the workflow definitions, bot content, templates,
          messages, and other material you submit to Telegraph. You grant Telegraph
          the limited rights needed to host, copy, process, transmit, and display
          that content solely to operate, secure, and improve the service.
        </p>
      </LegalSection>

      <LegalSection title="Service changes and availability">
        <p>
          Telegraph may change, improve, suspend, or discontinue any part of the
          service at any time. Availability can be affected by maintenance,
          infrastructure issues, Telegram platform behavior, abuse-prevention
          controls, and other factors outside Telegraph’s reasonable control.
        </p>
      </LegalSection>

      <LegalSection title="Suspension and termination">
        <p>
          Telegraph may suspend or terminate access if you violate these terms,
          create security or legal risk, fail to pay applicable fees, or use the
          service in a way that harms Telegraph, its users, or third parties.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers">
        <p>
          Telegraph is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
          To the fullest extent permitted by law, Telegraph disclaims warranties of
          merchantability, fitness for a particular purpose, non-infringement, and
          uninterrupted or error-free operation.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Telegraph will not be liable for
          indirect, incidental, special, consequential, exemplary, or punitive
          damages, or for loss of profits, revenue, goodwill, data, or business
          interruption arising from or related to the service.
        </p>
        <p>
          To the fullest extent permitted by law, Telegraph’s aggregate liability
          for claims arising out of or related to the service will not exceed the
          amount you paid Telegraph for the service during the 12 months before the
          event giving rise to the claim, or one hundred U.S. dollars if you have
          not paid for the service.
        </p>
      </LegalSection>

      <LegalSection title="Indemnity">
        <p>
          You will defend, indemnify, and hold harmless Telegraph and its operators
          from claims, losses, liabilities, and expenses arising from your content,
          your workflows, your connected bots, your use of the service, or your
          violation of these terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          Telegraph may update these terms from time to time. When that happens, the
          effective date above should be revised. Continued use of the service after
          an update takes effect means you accept the updated terms.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
