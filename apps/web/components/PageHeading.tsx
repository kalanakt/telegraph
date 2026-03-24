import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  subtitle,
  action,
  className
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("page-heading md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="page-title font-[var(--font-display)]">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {action ? <div className="pt-1 md:pt-0">{action}</div> : null}
    </div>
  );
}
