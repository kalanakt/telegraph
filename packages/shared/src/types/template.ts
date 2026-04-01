import type { FlowDefinition, TriggerType } from "./workflow.js";

export type TemplateVisibility = "PRIVATE" | "PUBLIC";

export type TemplateFlowDraft = {
  id?: string;
  name: string;
  trigger: TriggerType;
  flowDefinition: FlowDefinition;
};

export type WorkflowTemplateDraft = {
  title: string;
  description?: string;
  visibility: TemplateVisibility;
  flows: TemplateFlowDraft[];
};
