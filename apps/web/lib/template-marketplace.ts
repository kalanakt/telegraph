type PublicMarketplaceTemplate = {
  source: "builtin" | "user";
  featured: boolean;
};

export function groupPublicMarketplaceTemplates<T extends PublicMarketplaceTemplate>(templates: T[]) {
  return {
    featuredTemplates: templates.filter((template) => template.source === "builtin" && template.featured),
    advancedBuiltIns: templates.filter((template) => template.source === "builtin" && !template.featured),
    publishedByUsers: templates.filter((template) => template.source === "user"),
  };
}
