"use client";

import { useMemo, useState } from "react";
import { CopyPlus, Redo2, Search, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BotOption, FlowNodeKind, RuleOption } from "./types";

type Props = {
  botId: string;
  bots: BotOption[];
  name: string;
  selectedRuleId: string;
  rules: RuleOption[];
  isSaving: boolean;
  isDirty: boolean;
  autosaveState: string;
  status: string;
  nodeCount: number;
  edgeCount: number;
  hasTrigger: boolean;
  validationIssues: string[];
  canUndo: boolean;
  canRedo: boolean;
  onBotChange: (id: string) => void;
  onNameChange: (name: string) => void;
  onRuleChange: (id: string) => void;
  onAddNode: (kind: FlowNodeKind) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicateNode: () => void;
  onSave: () => void;
};

const NODE_GROUPS: Array<{ label: string; items: Array<{ kind: FlowNodeKind; label: string }> }> = [
  { label: "Trigger", items: [{ kind: "start", label: "Trigger" }] },
  {
    label: "Logic",
    items: [
      { kind: "condition", label: "Condition" },
      { kind: "switch", label: "Switch" },
      { kind: "set_variable", label: "Set Variable" },
      { kind: "delay", label: "Delay" },
    ],
  },
  { label: "Telegram", items: [{ kind: "action", label: "Telegram / API Action" }] },
  { label: "External", items: [{ kind: "action", label: "HTTP / Webhook Action" }] },
  { label: "Bot tools", items: [{ kind: "action", label: "Bot Tool Action" }] },
];

export function FlowToolbar({
  botId,
  bots,
  name,
  selectedRuleId,
  rules,
  isSaving,
  isDirty,
  autosaveState,
  status,
  nodeCount,
  edgeCount,
  hasTrigger,
  validationIssues,
  canUndo,
  canRedo,
  onBotChange,
  onNameChange,
  onRuleChange,
  onAddNode,
  onUndo,
  onRedo,
  onDuplicateNode,
  onSave,
}: Props) {
  const [query, setQuery] = useState("");
  const filteredGroups = useMemo(
    () =>
      NODE_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
      })).filter((group) => group.items.length > 0),
    [query],
  );

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="builder-label">
          <span>Flow</span>
          <Select
            value={selectedRuleId}
            onValueChange={onRuleChange}
          >
            <SelectTrigger className="builder-field builder-field-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New flow</SelectItem>
              {rules.map((rule) => (
                <SelectItem key={rule.id} value={rule.id}>
                  {rule.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="builder-label">
          <span>Bot</span>
          <Select
            value={botId}
            onValueChange={onBotChange}
          >
            <SelectTrigger className="builder-field builder-field-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bots.map((bot) => (
                <SelectItem key={bot.id} value={bot.id}>
                  {bot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="builder-label">
          <span>Flow name</span>
          <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border/85 bg-background/70 px-3 py-3 shadow-sm backdrop-blur-sm">
        <Button type="button" variant="outline" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
          Undo
        </Button>
        <Button type="button" variant="outline" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
          Redo
        </Button>
        <Button type="button" variant="outline" onClick={onDuplicateNode}>
          <CopyPlus className="h-4 w-4" />
          Duplicate
        </Button>
        <Button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving
            ? "Saving..."
            : selectedRuleId === "new"
            ? "Create Flow"
            : "Update Flow"}
        </Button>
        <Badge variant={isDirty ? "secondary" : "outline"} className="border border-border/80 bg-background/70 text-foreground/88">
          {autosaveState}
        </Badge>
        <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/76">Nodes: {nodeCount}</Badge>
        <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/76">Edges: {edgeCount}</Badge>
        <Badge variant={validationIssues.length > 0 ? "secondary" : "outline"} className="border border-border/80 bg-background/70 text-foreground/88">
          {validationIssues.length > 0 ? `${validationIssues.length} validation issue(s)` : "Validation clean"}
        </Badge>
        {status ? <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/88">{status}</Badge> : null}
      </div>

      <div className="rounded-sm border border-border/85 bg-background/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search builder nodes"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {filteredGroups.map((group) => (
            <div key={group.label} className="space-y-2 rounded-sm border border-border/80 bg-background/55 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <Button
                    key={`${group.label}-${item.label}`}
                    type="button"
                    variant="secondary"
                    onClick={() => onAddNode(item.kind)}
                    disabled={item.kind === "start" && hasTrigger}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {validationIssues.length > 0 ? (
          <div className="mt-3 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {validationIssues[0]}
          </div>
        ) : null}
      </div>
    </>
  );
}
