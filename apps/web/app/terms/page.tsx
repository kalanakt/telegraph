import { PageHeading } from "@/components/PageHeading";

export default function TermsPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Terms of service"
        subtitle="Usage terms for Telegraph automation services and related infrastructure."
      />
      <section className="surface-panel space-y-3 p-6 text-sm text-muted-foreground">
        <p>Telegraph is provided as-is for building and operating Telegram automations.</p>
        <p>You are responsible for bot behavior, message content, and compliance with Telegram platform policies.</p>
        <p>We may enforce plan limits to protect platform stability and service reliability.</p>
      </section>
    </div>
  );
}
