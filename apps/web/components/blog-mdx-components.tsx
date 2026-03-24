import Link from "next/link";
import type { ComponentType } from "react";

type MdxComponentMap = Record<string, ComponentType<any>>;

export const blogMdxComponents: MdxComponentMap = {
  h1: ({ children }) => <h1 className="blog-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="blog-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="blog-h3">{children}</h3>,
  p: ({ children }) => <p className="blog-p">{children}</p>,
  ul: ({ children }) => <ul className="blog-ul">{children}</ul>,
  ol: ({ children }) => <ol className="blog-ol">{children}</ol>,
  li: ({ children }) => <li className="blog-li">{children}</li>,
  a: ({ href = "", children }) => {
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
  code: ({ children }) => <code className="blog-inline-code">{children}</code>,
  pre: ({ children }) => <pre className="blog-pre">{children}</pre>,
  blockquote: ({ children }) => <blockquote className="blog-callout">{children}</blockquote>,
  hr: () => <hr className="blog-hr" />,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>
};
