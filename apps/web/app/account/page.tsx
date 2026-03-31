import { UserProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { Card, CardContent } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { clerkProfileAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function AccountProfilePage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/account/profile");
  }

  return (
    <div className="space-y-6">
      <Card className="surface-panel">
        <CardContent className="p-4 md:p-6">
          <UserProfile appearance={clerkProfileAppearance} routing="hash" />
        </CardContent>
      </Card>
    </div>
  );
}
