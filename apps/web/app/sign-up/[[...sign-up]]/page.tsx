import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

export const metadata: Metadata = {
  title: "Start Free | Telegraph",
  description: "Create a Telegraph account and start building Telegram bot automations.",
  robots: {
    index: false,
    follow: false,
  },
};

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
