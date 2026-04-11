import { describe, expect, it } from "vitest";
import { groupPublicMarketplaceTemplates } from "@/lib/template-marketplace";

describe("groupPublicMarketplaceTemplates", () => {
  it("splits featured built-ins, advanced built-ins, and user-published templates", () => {
    const grouped = groupPublicMarketplaceTemplates([
      { id: "builtin:a", source: "builtin" as const, featured: true },
      { id: "builtin:b", source: "builtin" as const, featured: false },
      { id: "user:c", source: "user" as const, featured: false },
    ]);

    expect(grouped.featuredTemplates.map((template) => template.id)).toEqual(["builtin:a"]);
    expect(grouped.advancedBuiltIns.map((template) => template.id)).toEqual(["builtin:b"]);
    expect(grouped.publishedByUsers.map((template) => template.id)).toEqual(["user:c"]);
  });
});
