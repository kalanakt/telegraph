import type { ReactNode } from "react";
import Link from "next/link";
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
    <div className="public-page">
      <section className="public-hero-surface">
        <div className="grid gap-4">
          <Badge variant="secondary" className="w-fit rounded-lg">
            Telegraph legal
          </Badge>
          <h1 className="public-display max-w-[12ch]">{title}</h1>
          <p className="public-body">{subtitle}</p>
        </div>
      </section>

      <section className="public-band flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-lg">
            Effective {effectiveDate}
          </Badge>
          <Badge variant="outline" className="rounded-lg">
            Public policy
          </Badge>
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
              className="focus-ring rounded-md border border-border/65 bg-background/70 px-3 py-1.5 transition-colors hover:text-foreground"
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
    <section className="public-card md:p-8">
      <div className="max-w-[82ch] space-y-4">
        <h2 className="font-display text-2xl font-semibold leading-tight text-foreground">
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
