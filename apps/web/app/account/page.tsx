import { UserProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { isClerkConfigured } from "@/lib/auth-config";
import { clerkProfileAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function AccountPage() {
  if (isClerkConfigured()) {
    const userId = await getAuthUserId();
    if (!userId) {
      redirect("/sign-in");
    }
  }

  return (
    <div className="space-y-6">
      <div className="surface-panel p-4 md:p-6">
        <UserProfile
          appearance={clerkProfileAppearance}
          path="/account"
          routing="path"
        />
      </div>
    </div>
  );
}
