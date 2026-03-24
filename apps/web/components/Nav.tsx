import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { NavLinks } from "@/components/NavLinks";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/auth-config";
import { getAuthUserId } from "@/lib/clerk-auth";

type SignedInNavItem = {
  href: string;
  label: string;
  icon: "gauge" | "bot" | "sparkles" | "list-checks" | "receipt";
};
type SignedOutNavItem = { href: string; label: string };

const signedInNavItems: SignedInNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "gauge" },
  { href: "/bots", label: "Bots", icon: "bot" },
  { href: "/builder", label: "Builder", icon: "sparkles" },
  { href: "/runs", label: "Runs", icon: "list-checks" },
  { href: "/pricing", label: "Pricing", icon: "receipt" },
];

const signedOutNavItems: SignedOutNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export async function Nav() {
  const hasClerk = isClerkConfigured();
  const userId = hasClerk ? await getAuthUserId() : "local-dev-user";
  const isSignedIn = Boolean(userId);

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="mr-2 inline-flex items-center rounded-md bg-foreground px-3 py-2 text-background"
          >
            <span className="text-sm font-semibold tracking-[0.04em]">
              Telegraph
            </span>
          </Link>

          <NavLinks
            signedInNavItems={signedInNavItems}
            signedOutNavItems={signedOutNavItems}
            isSignedIn={isSignedIn}
          />
        </div>

        {hasClerk ? (
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <Button asChild type="button" variant="secondary">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild type="button">
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
