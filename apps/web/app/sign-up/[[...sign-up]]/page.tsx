import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/PageHeading";
import { Card, CardContent } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/auth-config";
import { getAuthUserId } from "@/lib/clerk-auth";

export default async function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <PageHeading
          title="Sign up disabled"
          subtitle="Clerk keys are not configured for this environment."
        />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code>CLERK_SECRET_KEY</code> to enable sign up.
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
      <PageHeading
        title="Create account"
        subtitle="Set up your Telegraph workspace and start shipping automations."
      />
      <SignUp />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="focus-ring underline-offset-4 hover:underline" href="/sign-in">
          Sign in
        </Link>
      </p>
    </div>
  );
}
