import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { NavLinks } from "@/components/NavLinks";
import { Button } from "@/components/ui/button";
import { clerkUserButtonAppearance } from "@/lib/clerk-appearance";
import { getAuthUserId } from "@/lib/clerk-auth";

type SignedInNavItem = {
  href: string;
  label: string;
  icon: "gauge" | "bot" | "sparkles" | "templates" | "list-checks" | "receipt" | "folder-open";
};
type SignedOutNavItem = { href: string; label: string };

const signedInNavItems: SignedInNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "gauge" },
  { href: "/bots", label: "Bots", icon: "bot" },
  { href: "/flows", label: "Flows", icon: "sparkles" },
  { href: "/library", label: "Library", icon: "folder-open" },
  { href: "/templates", label: "Templates", icon: "templates" },
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
  const mobileActions = isSignedIn ? (
    <>
      <div className="flex items-center justify-between gap-3 rounded-sm border border-border/70 bg-background/80 p-2">
        <span className="text-xs font-medium text-muted-foreground">Workspace</span>
        <OrganizationSwitcher
          appearance={clerkUserButtonAppearance}
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          organizationProfileMode="navigation"
          organizationProfileUrl="/orgs"
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-sm border border-border/70 bg-background/80 p-2">
        <span className="text-xs font-medium text-muted-foreground">Account</span>
        <UserButton
          appearance={clerkUserButtonAppearance}
          userProfileMode="navigation"
          userProfileUrl="/account"
        />
      </div>
    </>
  ) : (
    <>
      <Button asChild type="button" variant="ghost" className="w-full">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild type="button" className="w-full">
        <Link href="/sign-up">Start free</Link>
      </Button>
    </>
  );

  return (
    <header className="mb-8 md:mb-12">
      <div className="px-1 py-3">
        <MobileNavMenu
          signedInNavItems={signedInNavItems}
          signedOutNavItems={signedOutNavItems}
          isSignedIn={isSignedIn}
          actions={mobileActions}
        />

        <div className="hidden flex-col gap-4 md:flex xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <Link
              href="/"
              className="focus-ring inline-flex w-fit items-center gap-3 rounded-sm border px-3.5 py-2.5"
            >
              <span className="text-sm font-semibold tracking-[0.02em]">
                Telegraph
              </span>
            </Link>

            <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <NavLinks
                signedInNavItems={signedInNavItems}
                signedOutNavItems={signedOutNavItems}
                isSignedIn={isSignedIn}
              />
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 self-start md:w-auto xl:self-auto">
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
                    appearance={clerkUserButtonAppearance}
                    userProfileMode="navigation"
                    userProfileUrl="/account"
                  />
                </div>
              </>
            ) : (
              <>
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild type="button" className="w-full sm:w-auto">
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
