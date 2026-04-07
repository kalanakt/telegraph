"use client";

import { CopyPlus, PanelLeftOpen, Redo2, Undo2 } from "lucide-react";
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
import type { BotOption, RuleOption } from "./types";

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
  validationIssues: string[];
  canUndo: boolean;
  canRedo: boolean;
  onBotChange: (id: string) => void;
  onNameChange: (name: string) => void;
  onRuleChange: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicateNode: () => void;
  onSave: () => void;
  onOpenPalette: () => void;
};

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
  validationIssues,
  canUndo,
  canRedo,
  onBotChange,
  onNameChange,
  onRuleChange,
  onUndo,
  onRedo,
  onDuplicateNode,
  onSave,
  onOpenPalette,
}: Props) {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="builder-label">
          <span>Flow</span>
          <Select value={selectedRuleId} onValueChange={onRuleChange}>
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
          <Select value={botId} onValueChange={onBotChange}>
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
        <Button type="button" variant="outline" className="lg:hidden" onClick={onOpenPalette}>
          <PanelLeftOpen className="h-4 w-4" />
          Add nodes
        </Button>
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
          {isSaving ? "Saving..." : selectedRuleId === "new" ? "Create Flow" : "Update Flow"}
        </Button>
        <Badge variant={isDirty ? "secondary" : "outline"} className="border border-border/80 bg-background/70 text-foreground/88">
          {autosaveState}
        </Badge>
        <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/76">
          Nodes: {nodeCount}
        </Badge>
        <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/76">
          Edges: {edgeCount}
        </Badge>
        <Badge variant={validationIssues.length > 0 ? "secondary" : "outline"} className="border border-border/80 bg-background/70 text-foreground/88">
          {validationIssues.length > 0 ? `${validationIssues.length} validation issue(s)` : "Validation clean"}
        </Badge>
        {status ? <Badge variant="outline" className="border border-border/80 bg-background/70 text-foreground/88">{status}</Badge> : null}
      </div>

      {validationIssues.length > 0 ? (
        <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {validationIssues[0]}
        </div>
      ) : null}
    </>
  );
}
