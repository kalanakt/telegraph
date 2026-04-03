import type { Metadata } from "next";
import { LegalDocument, LegalList, LegalSection } from "@/components/legal/LegalDocument";
import { toAbsoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Cookie Policy | Telegraph",
  description:
    "Understand the essential cookies and consent-based analytics controls used by Telegraph.",
  alternates: {
    canonical: toAbsoluteUrl("/cookies"),
  },
  openGraph: {
    title: "Cookie Policy | Telegraph",
    description:
      "Understand the essential cookies and consent-based analytics controls used by Telegraph.",
    url: toAbsoluteUrl("/cookies"),
    type: "website",
  },
};

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie policy"
      subtitle="How Telegraph uses essential cookies and consent-gated analytics technologies."
      effectiveDate="April 3, 2026"
      summary={
        <p>
          This page describes the current cookie posture for Telegraph. The app
          uses Clerk for authentication, Creem for billing-related account
          flows, and keeps third-party product analytics disabled by default.
          If analytics are enabled in production, Telegraph loads them only
          after an explicit user consent choice.
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

      <LegalSection title="Optional analytics technologies">
        <p>
          Telegraph does not load third-party product analytics by default. If
          an analytics integration such as Contentsquare is enabled for the
          production workspace, Telegraph shows a consent prompt first and only
          loads that script after the visitor opts in.
        </p>
        <p>
          Telegraph does not currently use advertising cookies or cross-site
          behavioral marketing tags.
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
        <p>
          If optional analytics are enabled, you can accept or decline them from
          the consent prompt. Declining keeps those scripts disabled.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
