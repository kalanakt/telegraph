import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

function writePost(dir: string, fileName: string, content: string) {
  fs.writeFileSync(path.join(dir, fileName), content, "utf8");
}

describe("blog helpers", () => {
  let tmpDir: string;
  let originalNodeEnv: string | undefined;
  let originalBlogDir: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "telegraph-blog-test-"));
    originalNodeEnv = process.env.NODE_ENV;
    originalBlogDir = process.env.BLOG_CONTENT_DIR;
    process.env.BLOG_CONTENT_DIR = tmpDir;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalBlogDir === undefined) {
      delete process.env.BLOG_CONTENT_DIR;
    } else {
      process.env.BLOG_CONTENT_DIR = originalBlogDir;
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("parses valid frontmatter and normalizes slug", async () => {
    writePost(
      tmpDir,
      "My First_Post.mdx",
      `---\ntitle: My first post\ndescription: A short summary\npublishedAt: 2026-03-10\ntags: [Product, Launch]\n---\n\nHello world`
    );

    const blog = await import("@/lib/blog?case=valid");
    const posts = blog.getAllBlogPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("my-first-post");
    expect(posts[0].tags).toEqual(["product", "launch"]);
  });

  it("throws on invalid frontmatter", async () => {
    writePost(
      tmpDir,
      "broken.mdx",
      `---\ntitle: Broken\ndescription: Missing date and wrong tags\ntags: should-be-array\n---\n\nOops`
    );

    const blog = await import("@/lib/blog?case=invalid");

    expect(() => blog.getAllBlogPosts()).toThrow(/Invalid blog frontmatter/);
  });

  it("filters drafts in production", async () => {
    writePost(
      tmpDir,
      "draft-post.mdx",
      `---\ntitle: Draft\ndescription: Draft entry\npublishedAt: 2026-03-01\ntags: [notes]\ndraft: true\n---\n\nDraft body`
    );

    writePost(
      tmpDir,
      "published-post.mdx",
      `---\ntitle: Published\ndescription: Published entry\npublishedAt: 2026-03-02\ntags: [release]\n---\n\nPublished body`
    );

    process.env.NODE_ENV = "production";

    const blog = await import("@/lib/blog?case=prod");

    expect(blog.getAllBlogPosts().map((post) => post.slug)).toEqual(["published-post"]);
    expect(blog.getPublishedBlogPosts().map((post) => post.slug)).toEqual(["published-post"]);
  });

  it("supports query and tag filtering", async () => {
    const blog = await import("@/lib/blog?case=filter");

    const posts = [
      {
        slug: "alpha",
        title: "Queue Reliability Guide",
        description: "Keep worker throughput stable",
        publishedAt: "2026-03-20",
        tags: ["reliability", "queue"]
      },
      {
        slug: "beta",
        title: "Product Launch Story",
        description: "How teams shipped visual flows",
        publishedAt: "2026-03-21",
        tags: ["product", "workflow"]
      }
    ];

    expect(blog.filterBlogPosts(posts, { q: "launch" }).map((post) => post.slug)).toEqual(["beta"]);
    expect(blog.filterBlogPosts(posts, { tag: "QUEUE" }).map((post) => post.slug)).toEqual(["alpha"]);
    expect(blog.filterBlogPosts(posts, { q: "guide", tag: "reliability" }).map((post) => post.slug)).toEqual(["alpha"]);
  });
});
