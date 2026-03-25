"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BotOption, RuleOption } from "./types";

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
  onBotChange: (id: string) => void;
  onNameChange: (name: string) => void;
  onRuleChange: (id: string) => void;
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
  onBotChange,
  onNameChange,
  onRuleChange,
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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-2">
        <Button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving
            ? "Saving..."
            : selectedRuleId === "new"
            ? "Create Builder"
            : "Update Builder"}
        </Button>
        <Badge variant="secondary">Click a node to edit in inspector</Badge>
        <Badge variant="outline">Nodes: {nodeCount}</Badge>
        <Badge variant="outline">Edges: {edgeCount}</Badge>
        {status ? <Badge variant="outline">{status}</Badge> : null}
      </div>
    </>
  );
}
