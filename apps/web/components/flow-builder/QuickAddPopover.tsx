"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BuilderIcon } from "./BuilderIcon";
import type { BuilderNodeCatalogItem, BuilderNodeCatalogSection, QuickAddContext } from "./types";

type Props = {
  context: QuickAddContext | null;
  sections: BuilderNodeCatalogSection[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelectItem: (item: BuilderNodeCatalogItem) => void;
  onClose: () => void;
};

function filterSections(sections: BuilderNodeCatalogSection[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return sections;

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        [item.title, item.description, item.group].join(" ").toLowerCase().includes(normalized),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function QuickAddPopover({
  context,
  sections,
  query,
  onQueryChange,
  onSelectItem,
  onClose,
}: Props) {
  if (!context) return null;

  const filtered = filterSections(sections, query);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const left = Math.max(16, Math.min(context.anchor.x - 180, viewportWidth - 392));
  const top = Math.max(16, Math.min(context.anchor.y + 12, viewportHeight - 520));

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute w-[360px] rounded-sm border border-border/85 bg-card/98 shadow-2xl"
        style={{ left, top }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/80 px-3 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Insert node</p>
            <p className="text-xs text-muted-foreground">Choose what to connect next.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-sm border border-border/80 bg-background/90 p-1.5 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border/80 px-3 py-3">
          <div className="flex items-center gap-2 rounded-sm border border-border/80 bg-background/80 px-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search nodes"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3">
          <div className="space-y-4">
            {filtered.map((section) => (
              <section key={section.id} className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => onSelectItem(item)}
                      className="w-full rounded-sm border border-border/80 bg-background/75 px-3 py-2.5 text-left transition hover:border-primary/45 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm border border-border/80 bg-secondary/55 text-foreground">
                          <BuilderIcon name={item.icon} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-foreground">{item.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-foreground/75">{item.description}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
