"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceAppShell } from "@/components/workspace/WorkspaceAppShell";

type AppChromeProps = {
  children: ReactNode;
  nav: ReactNode;
  footer: ReactNode;
  analyticsBanner: ReactNode;
};

function isWorkspaceRoute(pathname: string) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }

  if (pathname === "/bots" || pathname.startsWith("/bots/")) {
    return true;
  }

  if (pathname === "/flows" || pathname.startsWith("/flows/")) {
    return true;
  }

  if (pathname === "/runs" || pathname.startsWith("/runs/")) {
    return true;
  }

  if (pathname === "/builder" || pathname.startsWith("/builder/")) {
    return true;
  }

  if (
    (pathname === "/templates" || pathname.startsWith("/templates/")) &&
    !pathname.startsWith("/templates/public")
  ) {
    return true;
  }

  if (pathname === "/account" || pathname.startsWith("/account/")) {
    return true;
  }

  if (pathname === "/orgs" || pathname.startsWith("/orgs/")) {
    return true;
  }

  return false;
}

export function AppChrome({
  children,
  nav,
  footer,
  analyticsBanner,
}: AppChromeProps) {
  const pathname = usePathname();
  const workspaceRoute = isWorkspaceRoute(pathname);

  return (
    <>
      {workspaceRoute ? (
        <WorkspaceAppShell mainId="main-content">{children}</WorkspaceAppShell>
      ) : (
        <div className="app-shell">
          {nav}
          <main id="main-content">{children}</main>
          {footer}
        </div>
      )}
      {analyticsBanner}
    </>
  );
}
