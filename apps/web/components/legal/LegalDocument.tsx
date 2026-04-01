import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { Badge } from "@/components/ui/badge";

type LegalDocumentProps = {
  title: string;
  subtitle: string;
  summary: ReactNode;
  effectiveDate: string;
  children: ReactNode;
};

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function LegalDocument({
  title,
  subtitle,
  summary,
  effectiveDate,
  children,
}: LegalDocumentProps) {
  return (
    <div className="space-y-6">
      <PageHeading title={title} subtitle={subtitle} />

      <section className="surface-panel flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Effective {effectiveDate}</Badge>
          <Badge variant="outline">Telegraph legal</Badge>
        </div>

        <div className="max-w-[78ch] text-sm leading-6 text-muted-foreground">
          {summary}
        </div>

        <nav
          aria-label="Legal documents"
          className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
        >
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              className="focus-ring border-b border-border/70 pb-0.5 transition-colors hover:text-foreground"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </section>

      <div className="grid gap-4">{children}</div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-panel p-6 md:p-8">
      <div className="max-w-[82ch] space-y-4">
        <h2
          className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <div className="space-y-4 text-sm leading-7 text-muted-foreground">
          {children}
        </div>
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="grid gap-2 pl-5 text-sm leading-7 text-muted-foreground">
      {items.map((item, index) => (
        <li key={index} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}
