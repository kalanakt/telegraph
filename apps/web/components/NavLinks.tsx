"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bot, Gauge, ListChecks, ReceiptText, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type IconName = "gauge" | "bot" | "sparkles" | "list-checks" | "receipt";
type SignedInNavItem = { href: string; label: string; icon: IconName };
type SignedOutNavItem = { href: string; label: string };

const iconMap: Record<IconName, LucideIcon> = {
  gauge: Gauge,
  bot: Bot,
  sparkles: Sparkles,
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
                  "focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
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
                  "focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-secondary text-foreground"
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
