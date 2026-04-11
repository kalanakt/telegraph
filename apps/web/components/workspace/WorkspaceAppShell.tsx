"use client";

import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  Bot,
  Building2,
  FolderOpen,
  Gauge,
  LayoutTemplate,
  ListChecks,
  Settings2,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { clerkUserButtonAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";
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
    href: "/library",
    label: "Library",
    icon: FolderOpen,
    detail: "Uploaded files",
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
    <SidebarGroup className="py-2 group-data-[collapsible=icon]:px-1">
      <SidebarGroupLabel className="workspace-sidebar-group-label group-data-[collapsible=icon]:hidden">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = itemIsActive(pathname, item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className="workspace-sidebar-menu-button h-12 font-medium"
                >
                  <Link href={item.href}>
                    <span className="workspace-sidebar-icon-wrap">
                      <Icon />
                    </span>
                    <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="text-[0.92rem] font-medium tracking-[-0.02em]">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "truncate text-[0.74rem] font-normal group-data-[collapsible=icon]:hidden",
                          isActive
                            ? "text-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
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
          <SidebarHeader className="workspace-sidebar-header gap-0 p-2 group-data-[collapsible=icon]:p-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip="Telegraph"
                  className="workspace-sidebar-brand h-auto px-2 py-2"
                >
                  <Link href="/dashboard">
                    <span className="workspace-sidebar-brand-mark">T</span>
                    <span className="workspace-sidebar-brand-copy">
                      <span className="workspace-sidebar-kicker">
                        Automation workspace
                      </span>
                      <span className="workspace-sidebar-brand-title">
                        Telegraph
                      </span>
                      <span className="workspace-sidebar-brand-detail">
                        {currentSection?.detail ??
                          "Telegram automation control"}
                      </span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="pb-3 pt-2 group-data-[collapsible=icon]:px-1">
            <WorkspaceNavGroup
              label="Workspace"
              items={primaryNavItems}
              pathname={pathname}
            />
            <SidebarSeparator className="mx-3" />
            <WorkspaceNavGroup
              label="Settings"
              items={secondaryNavItems}
              pathname={pathname}
            />
          </SidebarContent>

          <SidebarFooter className="workspace-sidebar-footer p-3">
            <div className="grid gap-2 group-data-[collapsible=icon]:hidden">
              <div className="workspace-sidebar-account-row">
                <div className="workspace-sidebar-account-copy">
                  <span className="workspace-sidebar-account-label pb-2">
                    Workspace
                  </span>
                </div>
                <OrganizationSwitcher
                  appearance={clerkUserButtonAppearance}
                  afterSelectOrganizationUrl="/dashboard"
                  afterCreateOrganizationUrl="/dashboard"
                  organizationProfileMode="navigation"
                  organizationProfileUrl="/orgs"
                />
              </div>
              <div className="workspace-sidebar-account-row">
                <div className="workspace-sidebar-account-copy pb-2">
                  <span className="workspace-sidebar-account-label">
                    Account
                  </span>
                </div>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={clerkUserButtonAppearance}
                  userProfileMode="navigation"
                  userProfileUrl="/account"
                />
              </div>
            </div>
            <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
              <UserButton
                afterSignOutUrl="/"
                appearance={clerkUserButtonAppearance}
                userProfileMode="navigation"
                userProfileUrl="/account"
              />
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
