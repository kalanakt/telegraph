import { UserProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkProfileAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function AccountProfilePage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/account");
  }

  return (
    <div className="mx-auto max-w-8xl">
      <UserProfile appearance={clerkProfileAppearance} routing="hash" />
    </div>
  );
}
