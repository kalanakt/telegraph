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
    <header className="mb-10">
      <div className="surface-panel px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-3 rounded-[1.3rem] bg-foreground px-3.5 py-2.5 text-background"
            >
              <span className="flex size-8 items-center justify-center rounded-[0.95rem] bg-background/12 text-sm font-semibold tracking-[-0.04em]">
                T
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold tracking-[0.02em]">
                  Telegraph
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.18em] text-background/65">
                  automation studio
                </span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-1.5 rounded-[1.2rem] border border-border/70 bg-secondary/72 p-1.5 backdrop-blur-sm">
              <NavLinks
                signedInNavItems={signedInNavItems}
                signedOutNavItems={signedOutNavItems}
                isSignedIn={isSignedIn}
              />
            </div>
          </div>

          {hasClerk ? (
            <div className="flex items-center gap-2 self-start xl:self-auto">
              {isSignedIn ? (
                <div className="rounded-[1rem] border border-border/70 bg-background/80 p-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
