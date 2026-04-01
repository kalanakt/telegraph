import type { FlowDefinition, TriggerType } from "@telegram-builder/shared";

export type TemplateEditorFlow = {
  id?: string;
  name: string;
  trigger: TriggerType;
  flowDefinition: FlowDefinition;
  sortOrder?: number;
};

export function createStarterTemplateFlow(name = "Flow 1"): TemplateEditorFlow {
  return {
    name,
    trigger: "message_received",
    flowDefinition: {
      nodes: [
        {
          id: "start_1",
          type: "start",
          position: { x: 220, y: 180 },
          data: {}
        }
      ],
      edges: []
    }
  };
}
