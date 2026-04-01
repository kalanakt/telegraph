import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function SignUpPage() {
  const userId = await getAuthUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <SignUp
        appearance={clerkAuthAppearance}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
      />
    </div>
  );
}
