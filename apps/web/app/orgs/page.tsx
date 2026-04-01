import { OrganizationList, OrganizationProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkProfileAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function OrganizationsPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/orgs");
  }

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="surface-panel p-5">
        <h1 className="text-lg font-semibold text-foreground">Organizations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an organization for your team, or switch between existing ones.
        </p>
        <div className="mt-4">
          <OrganizationList
            appearance={clerkProfileAppearance}
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
          />
        </div>
      </div>

      <div className="surface-panel p-5">
        <h2 className="text-base font-semibold text-foreground">Manage active organization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update members, roles, and settings for the currently selected organization.
        </p>
        <div className="mt-4">
          <OrganizationProfile appearance={clerkProfileAppearance} routing="hash" />
        </div>
      </div>
    </div>
  );
}
