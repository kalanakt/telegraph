import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.union([z.string().min(1), z.date()]),
  tags: z.array(z.string().min(1)).default([]),
  updatedAt: z.union([z.string().min(1), z.date()]).optional(),
  author: z.string().min(1).optional(),
  coverImage: z.string().min(1).optional(),
  draft: z.boolean().optional()
});

export type BlogFrontmatter = z.infer<typeof frontmatterSchema>;

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  coverImage?: string;
  draft?: boolean;
  tags: string[];
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

export type BlogFilter = {
  q?: string;
  tag?: string;
};

function resolveBlogDirectory() {
  const fromEnv = process.env.BLOG_CONTENT_DIR;
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  const cwd = process.cwd();
  const direct = path.join(cwd, "content", "blog");
  if (fs.existsSync(direct)) {
    return direct;
  }

  return path.join(cwd, "apps", "web", "content", "blog");
}

const BLOG_DIRECTORY = resolveBlogDirectory();

function toCanonicalTag(tag: string) {
  return tag.trim().toLowerCase();
}

function normalizeSlug(rawSlug: string) {
  return rawSlug
    .replace(/\.mdx?$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isValidDateString(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function normalizeFrontmatterDate(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function parseBlogFile(fileName: string): BlogPost {
  const fullPath = path.join(BLOG_DIRECTORY, fileName);
  const source = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(source);
  const frontmatter = frontmatterSchema.safeParse(parsed.data);

  if (!frontmatter.success) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: ${frontmatter.error.message}`);
  }

  const publishedAt = normalizeFrontmatterDate(frontmatter.data.publishedAt);
  const updatedAt = frontmatter.data.updatedAt ? normalizeFrontmatterDate(frontmatter.data.updatedAt) : undefined;

  if (!isValidDateString(publishedAt)) {
    throw new Error(`Invalid publishedAt date in ${fileName}: ${publishedAt}`);
  }

  if (updatedAt && !isValidDateString(updatedAt)) {
    throw new Error(`Invalid updatedAt date in ${fileName}: ${updatedAt}`);
  }

  const slug = normalizeSlug(fileName);

  return {
    slug,
    title: frontmatter.data.title,
    description: frontmatter.data.description,
    publishedAt,
    updatedAt,
    author: frontmatter.data.author,
    coverImage: frontmatter.data.coverImage,
    draft: frontmatter.data.draft,
    tags: frontmatter.data.tags.map(toCanonicalTag),
    content: parsed.content
  };
}

function includePostByEnvironment(post: BlogPostMeta) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return !post.draft;
}

function readAllBlogPostsFromDisk(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    return [];
  }

  const files = fs
    .readdirSync(BLOG_DIRECTORY)
    .filter((entry) => entry.endsWith(".mdx") || entry.endsWith(".md"));

  return files
    .map(parseBlogFile)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getAllBlogPosts(): BlogPost[] {
  return readAllBlogPostsFromDisk().filter(includePostByEnvironment);
}

export function getPublishedBlogPosts(): BlogPost[] {
  return readAllBlogPostsFromDisk().filter((post) => !post.draft);
}

export function getAllBlogPostMeta(): BlogPostMeta[] {
  return getAllBlogPosts().map(({ content: _content, ...meta }) => meta);
}

export function getPublishedBlogPostMeta(): BlogPostMeta[] {
  return getPublishedBlogPosts().map(({ content: _content, ...meta }) => meta);
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const normalizedSlug = normalizeSlug(slug);
  const posts = getAllBlogPosts();
  return posts.find((post) => post.slug === normalizedSlug) ?? null;
}

export function filterBlogPosts(posts: BlogPostMeta[], filters: BlogFilter): BlogPostMeta[] {
  const normalizedQuery = filters.q?.trim().toLowerCase() ?? "";
  const normalizedTag = filters.tag ? toCanonicalTag(filters.tag) : "";

  return posts.filter((post) => {
    const matchesTag = normalizedTag ? post.tags.includes(normalizedTag) : true;

    if (!matchesTag) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchBody = `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase();
    return searchBody.includes(normalizedQuery);
  });
}

export function getAllBlogTags(posts: BlogPostMeta[]) {
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort((a, b) => a.localeCompare(b));
}

export function getBlogBasePath(slug: string) {
  return `/blog/${normalizeSlug(slug)}`;
}
