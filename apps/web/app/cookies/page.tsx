import type { Metadata } from "next";
import { LegalDocument, LegalList, LegalSection } from "@/components/legal/LegalDocument";
import { toAbsoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Cookie Policy | Telegraph",
  description:
    "Understand the essential cookies and similar technologies used by Telegraph for authentication, security, and account access.",
  alternates: {
    canonical: toAbsoluteUrl("/cookies"),
  },
  openGraph: {
    title: "Cookie Policy | Telegraph",
    description:
      "Understand the essential cookies and similar technologies used by Telegraph for authentication, security, and account access.",
    url: toAbsoluteUrl("/cookies"),
    type: "website",
  },
};

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie policy"
      subtitle="How Telegraph uses essential cookies and similar technologies."
      effectiveDate="April 1, 2026"
      summary={
        <p>
          This page describes the current cookie posture for Telegraph. It is based
          on the present application setup, which uses Clerk for authentication,
          Creem for billing-related account flows, and does not include ad-tech
          or product analytics trackers in the app code.
        </p>
      }
    >
      <LegalSection title="What Telegraph uses cookies for">
        <LegalList
          items={[
            "Signing users in and keeping sessions active.",
            "Protecting the service from abuse, unauthorized access, and security threats.",
            "Supporting account, organization, and billing-related user flows delivered through Clerk and Creem.",
          ]}
        />
      </LegalSection>

      <LegalSection title="What Telegraph does not currently use cookies for">
        <p>
          Based on the current codebase, Telegraph does not currently include
          advertising cookies, cross-site behavioral tracking tags, or third-party
          product analytics trackers. If that changes, this page should be updated
          before the new tools are enabled in production.
        </p>
      </LegalSection>

      <LegalSection title="Third-party technologies">
        <p>
          Telegraph relies on third-party providers for authentication and billing
          workflows. Those providers may place or read cookies or similar
          technologies when you use sign-in, account management, checkout, or other
          related flows.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          Most browsers let you block or delete cookies. If you disable essential
          cookies, key parts of Telegraph such as sign-in, account security, and
          protected product areas may not work correctly.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
