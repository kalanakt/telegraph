"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SwitchEditorData } from "../types";

type Props = {
  data: SwitchEditorData;
  onUpdate: (partial: Record<string, unknown>) => void;
};

export function SwitchInspector({ data, onUpdate }: Props) {
  const cases = data.cases.length > 0 ? data.cases : [{ id: "match", value: "match", label: "Match" }];

  return (
    <>
      <div className="builder-section">
        <p className="builder-kicker">Switch path</p>
        <Input
          value={data.path}
          placeholder="event.text or vars.fetch_user.body.status"
          onChange={(event) => onUpdate({ path: event.target.value })}
        />
      </div>

      <div className="builder-section">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="builder-kicker">Branches</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onUpdate({
                cases: [
                  ...cases,
                  {
                    id: `case_${cases.length + 1}`,
                    value: "",
                    label: `Case ${cases.length + 1}`,
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add branch
          </Button>
        </div>

        <div className="space-y-3">
          {cases.map((flowCase, index) => (
            <div key={`${flowCase.id}-${index}`} className="rounded-md border border-border/80 bg-background/65 p-3">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={flowCase.label ?? ""}
                  placeholder="Branch label"
                  onChange={(event) =>
                    onUpdate({
                      cases: cases.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: event.target.value } : item,
                      ),
                    })
                  }
                />
                <Input
                  value={flowCase.value}
                  placeholder="Exact match value"
                  onChange={(event) =>
                    onUpdate({
                      cases: cases.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, value: event.target.value } : item,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={cases.length === 1}
                  onClick={() => onUpdate({ cases: cases.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Handle ID: {flowCase.id}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
