import { describe, expect, it } from "vitest";
import { workflowTemplateDraftSchema } from "@telegram-builder/shared";
import { CURATED_WORKFLOW_TEMPLATES } from "@/lib/template-library";

describe("curated workflow template library", () => {
  it("contains unique ids and slugs", () => {
    const ids = CURATED_WORKFLOW_TEMPLATES.map((template) => template.id);
    const slugs = CURATED_WORKFLOW_TEMPLATES.map((template) => template.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("contains only valid public workflow templates with production-ready metadata", () => {
    for (const template of CURATED_WORKFLOW_TEMPLATES) {
      const {
        id: _id,
        slug: _slug,
        category: _category,
        audience: _audience,
        featured: _featured,
        setupLevel: _setupLevel,
        requiresExternalIntegration: _requiresExternalIntegration,
        featuredOrder: _featuredOrder,
        ...draft
      } = template;
      const parsed = workflowTemplateDraftSchema.safeParse(draft);

      expect(parsed.success, `Expected '${template.slug}' to be a valid workflow template`).toBe(true);
      expect(template.visibility).toBe("PUBLIC");
      expect(template.flows.length).toBeGreaterThan(0);
      expect(template.id).toBe(`builtin:${template.slug}`);
      expect(template.requiresExternalIntegration).toBe(false);

      if (template.featured) {
        expect(typeof template.featuredOrder).toBe("number");
      } else {
        expect(template.featuredOrder).toBeUndefined();
      }

      const serialized = JSON.stringify(template).toLowerCase();
      expect(serialized).not.toContain("example.com");
      expect(serialized).not.toContain("replace the sample webhook url");
      expect(serialized).not.toContain("before enabling it in production");
    }
  });
});
