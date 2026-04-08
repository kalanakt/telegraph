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
    <div className="space-y-6">
      <div className="surface-panel">
        <OrganizationList
          appearance={clerkProfileAppearance}
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />
      </div>

      <div className="surface-panel">
        <OrganizationProfile
          appearance={clerkProfileAppearance}
          routing="hash"
        />
      </div>
    </div>
  );
}
