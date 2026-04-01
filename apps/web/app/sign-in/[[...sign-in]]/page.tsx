import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export const metadata: Metadata = {
  title: "Sign In | Telegraph",
  description: "Sign in to your Telegraph workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignInPage() {
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
