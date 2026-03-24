import { PageHeading } from "@/components/PageHeading";

export default function PrivacyPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Privacy policy"
        subtitle="How Telegraph handles account data, bot metadata, and workflow execution records."
      />
      <section className="surface-panel space-y-3 p-6 text-sm text-muted-foreground">
        <p>We store only the account and workflow data needed to run automations and provide execution history.</p>
        <p>Bot tokens are encrypted at rest and only used for Telegram API operations initiated by your workflows.</p>
        <p>You can request account deletion at any time to remove stored application data.</p>
      </section>
    </div>
  );
}
