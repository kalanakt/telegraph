"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Bot, FolderOpen, Gauge, LayoutTemplate, ListChecks, Menu, ReceiptText, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconName = "gauge" | "bot" | "sparkles" | "templates" | "list-checks" | "receipt" | "folder-open";
type SignedInNavItem = { href: string; label: string; icon: IconName };
type SignedOutNavItem = { href: string; label: string };

const iconMap: Record<IconName, LucideIcon> = {
  gauge: Gauge,
  bot: Bot,
  sparkles: Sparkles,
  templates: LayoutTemplate,
  "list-checks": ListChecks,
  receipt: ReceiptText,
  "folder-open": FolderOpen
};

function itemIsActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavMenu({
  signedInNavItems,
  signedOutNavItems,
  isSignedIn,
  actions
}: {
  signedInNavItems: SignedInNavItem[];
  signedOutNavItems: SignedOutNavItem[];
  isSignedIn: boolean;
  actions: ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = isSignedIn ? signedInNavItems : signedOutNavItems;

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="focus-ring inline-flex w-fit items-center gap-3 rounded-sm border px-3.5 py-2.5"
        >
          <span className="text-sm font-semibold tracking-[0.02em]">Telegraph</span>
        </Link>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {isOpen ? (
        <div className="surface-panel mt-3 flex flex-col gap-3 p-3">
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const isActive = itemIsActive(pathname, item.href);
              const Icon = isSignedIn ? iconMap[(item as SignedInNavItem).icon] : null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "focus-ring inline-flex items-center justify-between gap-3 rounded-sm border px-3 py-3 text-sm font-medium",
                    isActive
                      ? "border-border/80 bg-background text-foreground"
                      : "border-transparent bg-muted/35 text-muted-foreground"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {Icon ? <Icon className="size-4" /> : null}
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="grid gap-2 border-t border-border/70 pt-3">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}
