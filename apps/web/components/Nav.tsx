import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { NavLinks } from "@/components/NavLinks";
import { Button } from "@/components/ui/button";
import { clerkUserButtonAppearance } from "@/lib/clerk-appearance";
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
  { href: "/flows", label: "Flows", icon: "sparkles" },
  { href: "/runs", label: "Runs", icon: "list-checks" },
  { href: "/pricing", label: "Pricing", icon: "receipt" },
];

const signedOutNavItems: SignedOutNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export async function Nav() {
  const userId = await getAuthUserId();
  const isSignedIn = Boolean(userId);

  return (
    <header className="mb-12">
      <div className="px-1 py-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-3 border rounded-sm px-3.5 py-2.5"
            >
              <span className="text-sm font-semibold tracking-[0.02em]">
                Telegraph
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-1.5">
              <NavLinks
                signedInNavItems={signedInNavItems}
                signedOutNavItems={signedOutNavItems}
                isSignedIn={isSignedIn}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-start xl:self-auto">
            {isSignedIn ? (
              <>
                <div className="flex items-center justify-center bg-background/80 p-1 backdrop-blur-sm">
                  <OrganizationSwitcher
                    appearance={clerkUserButtonAppearance}
                    afterSelectOrganizationUrl="/dashboard"
                    afterCreateOrganizationUrl="/dashboard"
                    organizationProfileMode="navigation"
                    organizationProfileUrl="/orgs"
                  />
                </div>
                <div className="flex items-center justify-center bg-background/80 p-1 backdrop-blur-sm">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={clerkUserButtonAppearance}
                    userProfileMode="navigation"
                    userProfileUrl="/account"
                  />
                </div>
              </>
            ) : (
              <>
                <Button asChild type="button" variant="ghost">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild type="button">
                  <Link href="/sign-up">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
