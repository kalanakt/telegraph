import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code>CLERK_SECRET_KEY</code> to enable sign in.
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = await getAuthUserId();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <SignIn
        appearance={clerkAuthAppearance}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
