import { getPublishedBlogPostMeta, getBlogBasePath } from "@/lib/blog";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const posts = getPublishedBlogPostMeta();

  const items = posts
    .map((post) => {
      const link = toAbsoluteUrl(getBlogBasePath(post.slug));

      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${link}</link>
          <guid>${link}</guid>
          <description>${escapeXml(post.description)}</description>
          <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Telegraph Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Engineering notes and product updates from the Telegraph team.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
