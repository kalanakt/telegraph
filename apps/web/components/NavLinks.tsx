"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bot, Gauge, LayoutTemplate, ListChecks, ReceiptText, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type IconName = "gauge" | "bot" | "sparkles" | "templates" | "list-checks" | "receipt";
type SignedInNavItem = { href: string; label: string; icon: IconName };
type SignedOutNavItem = { href: string; label: string };

const iconMap: Record<IconName, LucideIcon> = {
  gauge: Gauge,
  bot: Bot,
  sparkles: Sparkles,
  templates: LayoutTemplate,
  "list-checks": ListChecks,
  receipt: ReceiptText
};

function itemIsActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  signedInNavItems,
  signedOutNavItems,
  isSignedIn
}: {
  signedInNavItems: SignedInNavItem[];
  signedOutNavItems: SignedOutNavItem[];
  isSignedIn: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {isSignedIn
        ? signedInNavItems.map((item) => {
            const isActive = itemIsActive(pathname, item.href);
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-ring inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2.5 text-xs font-medium sm:px-3.5 sm:text-sm",
                  isActive
                    ? "border border-border/80 bg-background text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })
        : signedOutNavItems.map((item) => {
            const isActive = itemIsActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-ring inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2.5 text-xs font-medium sm:px-3.5 sm:text-sm",
                  isActive
                    ? "border border-border/80 bg-background text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
    </>
  );
}
