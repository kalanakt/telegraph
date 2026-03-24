import type { MetadataRoute } from "next";
import { getPublishedBlogPostMeta, getBlogBasePath } from "@/lib/blog";
import { toAbsoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/pricing", "/privacy", "/terms", "/blog"];
  const blogPosts = getPublishedBlogPostMeta();

  return [
    ...staticRoutes.map((route) => ({
      url: toAbsoluteUrl(route),
      lastModified: new Date()
    })),
    ...blogPosts.map((post) => ({
      url: toAbsoluteUrl(getBlogBasePath(post.slug)),
      lastModified: new Date(post.updatedAt ?? post.publishedAt)
    }))
  ];
}
