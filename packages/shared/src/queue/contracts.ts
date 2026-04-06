import type { ExecutablePayload, ExecutionPolicy, FlowDefinition, JsonValue, NormalizedEvent } from "../types/workflow.js";

export const QUEUES = {
  ACTIONS: "actions",
  DEAD_LETTER: "dead-letter"
} as const;

export type ActionJob = {
  runId: string;
  ruleId: string;
  actionNodeId: string;
  actionRunId: string;
  botToken?: string | null;
  actionType: ExecutablePayload["type"];
  executionPolicy: ExecutionPolicy;
  idempotencyKey: string;
  action: ExecutablePayload;
  queueDelayMs?: number;
  event: NormalizedEvent;
  flowDefinition: FlowDefinition;
  context: {
    trigger: NormalizedEvent["trigger"];
    variables: Record<string, JsonValue>;
    createdAt: string;
  };
};
