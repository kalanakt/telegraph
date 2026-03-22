import { describe, expect, it } from "vitest";

import { buildTenantSlug, normalizeEmail } from "./auth.service.js";

describe("auth service helpers", () => {
  it("normalizes email to lowercase and trims whitespace", () => {
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });

  it("builds URL-safe tenant slugs from tenant names", () => {
    expect(buildTenantSlug("  ACME Workspace!  ")).toBe("acme-workspace");
  });

  it("falls back to workspace for empty/invalid tenant names", () => {
    expect(buildTenantSlug("---")).toBe("workspace");
  });

  it("limits tenant slug length to 50 chars", () => {
    const long = "a".repeat(80);
    expect(buildTenantSlug(long)).toHaveLength(50);
  });
});
