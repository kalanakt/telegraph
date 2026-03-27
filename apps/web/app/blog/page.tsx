import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filterBlogPosts, getAllBlogPostMeta, getAllBlogTags, getBlogBasePath } from "@/lib/blog";
import { toAbsoluteUrl } from "@/lib/site-url";

type SearchParams = {
  q?: string;
  tag?: string;
};

function formatDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(input));
}

export const metadata: Metadata = {
  title: "Blog | Telegraph",
  description: "Engineering notes and product updates from the Telegraph team.",
  alternates: {
    canonical: toAbsoluteUrl("/blog")
  },
  openGraph: {
    title: "Telegraph Blog",
    description: "Engineering notes and product updates from the Telegraph team.",
    type: "website",
    url: toAbsoluteUrl("/blog")
  }
};

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const tag = resolvedSearchParams?.tag?.trim() ?? "";
  const posts = getAllBlogPostMeta();
  const filteredPosts = filterBlogPosts(posts, { q: query, tag });
  const allTags = getAllBlogTags(posts);

  return (
    <div className="space-y-8 pb-4 pt-2">
      <PageHeading
        title="Blog"
        subtitle="Guides, release notes, and engineering write-ups from the Telegraph team."
      />

      <section className="surface-panel p-4 md:p-6">
        <form action="/blog" className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            aria-label="Search blog posts"
            className="focus-ring w-full rounded-sm border bg-white px-3 py-2 text-sm"
            defaultValue={query}
            name="q"
            placeholder="Search posts by title, summary, or tag"
            type="search"
          />

          <button className="focus-ring rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background" type="submit">
            Search
          </button>

          {tag ? <input name="tag" type="hidden" value={tag} /> : null}
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link className={`focus-ring rounded-sm px-3 py-1 text-xs font-medium ${tag ? "bg-secondary text-secondary-foreground" : "bg-foreground text-background"}`} href={query ? `/blog?q=${encodeURIComponent(query)}` : "/blog"}>
            All
          </Link>
          {allTags.map((item) => {
            const href = query
              ? `/blog?tag=${encodeURIComponent(item)}&q=${encodeURIComponent(query)}`
              : `/blog?tag=${encodeURIComponent(item)}`;

            return (
              <Link
                key={item}
                className={`focus-ring rounded-sm px-3 py-1 text-xs font-medium ${item === tag.toLowerCase() ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"}`}
                href={href}
              >
                {item}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No posts found</CardTitle>
              <CardDescription>Try a different search term or clear the active filters.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.slug} className="interactive-lift">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(post.publishedAt)}</span>
                  {post.author ? <span>By {post.author}</span> : null}
                </div>
                <CardTitle className="font-[var(--font-display)] text-[1.4rem] tracking-[-0.02em]">
                  <Link className="focus-ring underline-offset-4" href={getBlogBasePath(post.slug)}>
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription>{post.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                {post.tags.map((item) => (
                  <Badge key={item} variant="secondary">
                    <Link href={`/blog?tag=${encodeURIComponent(item)}`}>{item}</Link>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
