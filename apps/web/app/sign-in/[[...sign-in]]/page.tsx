import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { Card, CardContent } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";

export default async function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <PageHeading
          title="Sign in disabled"
          subtitle="Clerk keys are not configured for this environment."
        />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code>CLERK_SECRET_KEY</code> to enable sign in.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeading
        title="Sign in"
        subtitle="Access your Telegram automation workspace."
      />
      <SignIn />
    </div>
  );
}
