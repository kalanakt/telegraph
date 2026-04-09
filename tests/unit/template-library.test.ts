import { describe, expect, it } from "vitest";
import { workflowTemplateDraftSchema } from "@telegram-builder/shared";
import { CURATED_WORKFLOW_TEMPLATES } from "@/lib/template-library";

describe("curated workflow template library", () => {
  it("contains unique slugs", () => {
    const slugs = CURATED_WORKFLOW_TEMPLATES.map((template) => template.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("contains only valid public workflow templates", () => {
    for (const template of CURATED_WORKFLOW_TEMPLATES) {
      const { slug: _slug, ...draft } = template;
      const parsed = workflowTemplateDraftSchema.safeParse(draft);

      expect(parsed.success, `Expected '${template.slug}' to be a valid workflow template`).toBe(true);
      expect(template.visibility).toBe("PUBLIC");
      expect(template.flows.length).toBeGreaterThan(0);
    }
  });
});
