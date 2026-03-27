import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { blogMdxComponents } from "@/components/blog-mdx-components";
import { getAllBlogPostMeta, getBlogBasePath, getBlogPostBySlug } from "@/lib/blog";
import { toAbsoluteUrl } from "@/lib/site-url";

type PageParams = {
  slug: string;
};

function formatDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(input));
}

export function generateStaticParams() {
  return getAllBlogPostMeta().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: "Post not found | Telegraph",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const canonicalUrl = toAbsoluteUrl(getBlogBasePath(post.slug));

  return {
    title: `${post.title} | Telegraph Blog`,
    description: post.description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      url: canonicalUrl
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const { content } = await compileMDX({
    source: post.content,
    components: blogMdxComponents,
    options: {
      parseFrontmatter: false
    }
  });

  return (
    <article className="space-y-6 pb-8 pt-2">
      <header className="surface-panel p-6 md:p-8">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link className="focus-ring underline-offset-4" href="/blog">
              Blog
            </Link>
            <span> / </span>
            <span>{post.title}</span>
          </p>

          <h1 className="page-title">{post.title}</h1>
          <p className="page-subtitle">{post.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground md:text-sm">
            <span>{formatDate(post.publishedAt)}</span>
            {post.updatedAt ? <span>Updated {formatDate(post.updatedAt)}</span> : null}
            {post.author ? <span>By {post.author}</span> : null}
          </div>
        </div>
      </header>

      <section className="surface-panel p-6 md:p-8">
        <div className="blog-prose">{content}</div>
      </section>
    </article>
  );
}
