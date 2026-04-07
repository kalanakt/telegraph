"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BuilderIcon } from "./BuilderIcon";
import type { BuilderNodeCatalogItem, BuilderNodeCatalogSection } from "./types";

type Props = {
  sections: BuilderNodeCatalogSection[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelectItem: (item: BuilderNodeCatalogItem) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function filterSections(sections: BuilderNodeCatalogSection[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return sections;

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const haystack = [item.title, item.description, item.group].join(" ").toLowerCase();
        return haystack.includes(normalized);
      }),
    }))
    .filter((section) => section.items.length > 0);
}

function PaletteBody({
  sections,
  query,
  onQueryChange,
  onSelectItem,
  className,
}: {
  sections: BuilderNodeCatalogSection[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelectItem: (item: BuilderNodeCatalogItem) => void;
  className?: string;
}) {
  const filtered = filterSections(sections, query);

  return (
    <div className={cn("flex h-full flex-col rounded-sm border border-border/85 bg-card/95 shadow-sm", className)}>
      <div className="border-b border-border/80 px-3 py-3">
        <p className="text-sm font-semibold text-foreground">Node catalog</p>
        <p className="mt-1 text-xs text-muted-foreground">Search triggers, logic blocks, and actions.</p>
        <div className="mt-3 flex items-center gap-2 rounded-sm border border-border/80 bg-background/80 px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search nodes"
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          {filtered.map((section) => (
            <section key={section.id} className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    disabled={item.disabled}
                    className="group w-full rounded-sm border border-border/80 bg-background/75 px-3 py-3 text-left transition hover:border-primary/45 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                    title={item.disabledReason}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-border/80 bg-secondary/55 text-foreground">
                        <BuilderIcon name={item.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">{item.title}</span>
                          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            {item.group}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-foreground/75">
                          {item.description}
                        </span>
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
  );
}

export function FlowNodePalette({
  sections,
  query,
  onQueryChange,
  onSelectItem,
  mobileOpen,
  onMobileClose,
}: Props) {
  return (
    <>
      <div className="hidden lg:block">
        <PaletteBody sections={sections} query={query} onQueryChange={onQueryChange} onSelectItem={onSelectItem} className="h-[720px]" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/36 backdrop-blur-sm lg:hidden" onClick={onMobileClose}>
          <div
            className="absolute inset-y-0 left-0 w-[min(92vw,380px)] p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-end">
              <button type="button" onClick={onMobileClose} className="rounded-sm border border-border/80 bg-background/90 p-2 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <PaletteBody sections={sections} query={query} onQueryChange={onQueryChange} onSelectItem={onSelectItem} className="h-[calc(100vh-1.25rem)]" />
          </div>
        </div>
      ) : null}
    </>
  );
}
