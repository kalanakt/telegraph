"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BotOption, FlowNodeKind, RuleOption } from "./types";

type Props = {
  botId: string;
  bots: BotOption[];
  name: string;
  selectedRuleId: string;
  rules: RuleOption[];
  isSaving: boolean;
  status: string;
  nodeCount: number;
  edgeCount: number;
  hasTrigger: boolean;
  onBotChange: (id: string) => void;
  onNameChange: (name: string) => void;
  onRuleChange: (id: string) => void;
  onAddNode: (kind: FlowNodeKind) => void;
  onSave: () => void;
};

export function FlowToolbar({
  botId,
  bots,
  name,
  selectedRuleId,
  rules,
  isSaving,
  status,
  nodeCount,
  edgeCount,
  hasTrigger,
  onBotChange,
  onNameChange,
  onRuleChange,
  onAddNode,
  onSave,
}: Props) {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-3">
        <label className="builder-label">
          <span>Builder</span>
          <select
            className="builder-field builder-field-soft"
            value={selectedRuleId}
            onChange={(e) => onRuleChange(e.target.value)}
          >
            <option value="new">New builder</option>
            {rules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name}
              </option>
            ))}
          </select>
        </label>

        <label className="builder-label">
          <span>Bot</span>
          <select
            className="builder-field builder-field-soft"
            value={botId}
            onChange={(e) => onBotChange(e.target.value)}
          >
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.label}
              </option>
            ))}
          </select>
        </label>

        <label className="builder-label">
          <span>Builder name</span>
          <Input value={name} onChange={(e) => onNameChange(e.target.value)} required />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border/85 bg-white/82 px-3 py-3 shadow-sm backdrop-blur-sm">
        <Button type="button" variant="secondary" onClick={() => onAddNode("start")} disabled={hasTrigger}>
          Add trigger
        </Button>
        <Button type="button" variant="secondary" onClick={() => onAddNode("condition")}>
          Add condition
        </Button>
        <Button type="button" variant="secondary" onClick={() => onAddNode("action")}>
          Add action
        </Button>
        <Button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving
            ? "Saving..."
            : selectedRuleId === "new"
            ? "Create Builder"
            : "Update Builder"}
        </Button>
        <Badge variant="secondary" className="border border-border/80 bg-secondary/75 text-secondary-foreground">
          Add nodes here, then connect them on the canvas
        </Badge>
        <Badge variant="outline" className="border border-border/80 bg-white/65 text-foreground/76">Nodes: {nodeCount}</Badge>
        <Badge variant="outline" className="border border-border/80 bg-white/65 text-foreground/76">Edges: {edgeCount}</Badge>
        {status ? <Badge variant="outline" className="border border-border/80 bg-white/65 text-foreground/88">{status}</Badge> : null}
      </div>
    </>
  );
}
