import Link from "next/link";
import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from "react";

export type MdxComponentMap = Record<string, ComponentType<Record<string, unknown>>>;

type ChildrenProps = Record<string, unknown> & { children?: ReactNode };
type LinkProps = ComponentPropsWithoutRef<"a"> & Record<string, unknown>;

export const blogMdxComponents: MdxComponentMap = {
  h1: ({ children }: ChildrenProps) => <h1 className="blog-h1">{children}</h1>,
  h2: ({ children }: ChildrenProps) => <h2 className="blog-h2">{children}</h2>,
  h3: ({ children }: ChildrenProps) => <h3 className="blog-h3">{children}</h3>,
  p: ({ children }: ChildrenProps) => <p className="blog-p">{children}</p>,
  ul: ({ children }: ChildrenProps) => <ul className="blog-ul">{children}</ul>,
  ol: ({ children }: ChildrenProps) => <ol className="blog-ol">{children}</ol>,
  li: ({ children }: ChildrenProps) => <li className="blog-li">{children}</li>,
  a: ({ href = "", children }: LinkProps) => {
    const isExternal = href.startsWith("http://") || href.startsWith("https://");

    if (isExternal) {
      return (
        <a className="blog-link" href={href} rel="noreferrer" target="_blank">
          {children}
        </a>
      );
    }

    return (
      <Link className="blog-link" href={href}>
        {children}
      </Link>
    );
  },
  code: ({ children }: ChildrenProps) => <code className="blog-inline-code">{children}</code>,
  pre: ({ children }: ChildrenProps) => <pre className="blog-pre">{children}</pre>,
  blockquote: ({ children }: ChildrenProps) => <blockquote className="blog-callout">{children}</blockquote>,
  hr: () => <hr className="blog-hr" />,
  strong: ({ children }: ChildrenProps) => <strong className="font-semibold text-foreground">{children}</strong>
};
