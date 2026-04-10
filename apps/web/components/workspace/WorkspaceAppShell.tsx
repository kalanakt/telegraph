"use client";

import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  Bot,
  Building2,
  Gauge,
  LayoutTemplate,
  ListChecks,
  Settings2,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { clerkUserButtonAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

type WorkspaceAppShellProps = {
  children: React.ReactNode;
  mainId?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
  detail: string;
};

const primaryNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Gauge,
    detail: "Overview and activity",
  },
  {
    href: "/bots",
    label: "Bots",
    icon: Bot,
    detail: "Connections and health",
  },
  {
    href: "/flows",
    label: "Flows",
    icon: Sparkles,
    detail: "Automation logic",
  },
  {
    href: "/runs",
    label: "Runs",
    icon: ListChecks,
    detail: "Execution history",
  },
  {
    href: "/templates",
    label: "Templates",
    icon: LayoutTemplate,
    detail: "Reusable bundles",
  },
];

const secondaryNavItems: NavItem[] = [
  {
    href: "/account",
    label: "Account",
    icon: Settings2,
    detail: "Billing and profile",
  },
  {
    href: "/orgs",
    label: "Organizations",
    icon: Building2,
    detail: "Workspace access",
  },
];

function itemIsActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getCurrentSection(pathname: string) {
  return [...primaryNavItems, ...secondaryNavItems].find((item) =>
    itemIsActive(pathname, item.href),
  );
}

function WorkspaceNavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup className="px-2 py-2">
      <SidebarGroupLabel className="workspace-sidebar-group-label group-data-[collapsible=icon]:hidden">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={itemIsActive(pathname, item.href)}
                  tooltip={item.label}
                  className="workspace-sidebar-menu-button h-10 px-2.5 font-medium"
                >
                  <Link href={item.href}>
                    <span className="workspace-sidebar-icon-wrap">
                      <Icon />
                    </span>
                    <span className="grid flex-1 text-left leading-tight">
                      <span>{item.label}</span>
                      <span className="truncate text-[0.7rem] font-normal text-muted-foreground group-data-[collapsible=icon]:hidden">
                        {item.detail}
                      </span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function WorkspaceAppShell({
  children,
  mainId = "main-content",
}: WorkspaceAppShellProps) {
  const pathname = usePathname();
  const currentSection = getCurrentSection(pathname);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen>
        <Sidebar
          collapsible="icon"
          className="workspace-sidebar-shell border-r-0"
        >
          <SidebarHeader className="workspace-sidebar-header gap-0 p-2.5">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip="Telegraph"
                  className="workspace-sidebar-brand h-auto px-2.5 py-2.5"
                >
                  <Link href="/dashboard">
                    <span className="workspace-sidebar-brand-mark">T</span>
                    <span className="grid flex-1 text-left">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          Telegraph
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[0.62rem] uppercase tracking-[0.14em] group-data-[collapsible=icon]:hidden"
                        >
                          Live
                        </Badge>
                      </span>
                      <span className="truncate text-[0.72rem] text-muted-foreground">
                        Automation workspace
                      </span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="workspace-sidebar-header-panel group-data-[collapsible=icon]:hidden">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Current section
                </p>
                <p className="mt-1 text-sm font-medium">
                  {currentSection?.label ?? "Workspace"}
                </p>
                <p className="mt-1 text-[0.78rem] leading-5 text-muted-foreground">
                  {currentSection?.detail ?? "Product surface"}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-1 pb-2">
            <WorkspaceNavGroup
              label="Workspace"
              items={primaryNavItems}
              pathname={pathname}
            />
            <SidebarSeparator />
            <WorkspaceNavGroup
              label="Settings"
              items={secondaryNavItems}
              pathname={pathname}
            />
          </SidebarContent>

          <SidebarFooter className="workspace-sidebar-footer p-2.5">
            <div className="workspace-sidebar-shortcut group-data-[collapsible=icon]:hidden">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Shortcut
              </span>
              <span className="rounded-none border border-sidebar-border/80 bg-background px-1.5 py-0.5 text-[0.72rem] font-medium">
                Cmd/Ctrl + B
              </span>
            </div>
            <div className="grid gap-2 group-data-[collapsible=icon]:hidden">
              <div className="workspace-sidebar-account-row">
                <span className="text-xs font-medium text-muted-foreground">
                  Workspace
                </span>
                <OrganizationSwitcher
                  appearance={clerkUserButtonAppearance}
                  afterSelectOrganizationUrl="/dashboard"
                  afterCreateOrganizationUrl="/dashboard"
                  organizationProfileMode="navigation"
                  organizationProfileUrl="/orgs"
                />
              </div>
              <div className="workspace-sidebar-account-row">
                <span className="text-xs font-medium text-muted-foreground">
                  Account
                </span>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={clerkUserButtonAppearance}
                  userProfileMode="navigation"
                  userProfileUrl="/account"
                />
              </div>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset id={mainId} className="min-h-screen bg-background">
          <div className="workspace-toolbar">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {currentSection?.label ?? "Workspace"}
              </p>
              <p className="truncate text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                {currentSection?.detail ?? "Product surface"}
              </p>
            </div>
          </div>

          <div className={cn("workspace-content")}>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
