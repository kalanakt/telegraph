import type { ExecutablePayload, ExecutionPolicy, FlowDefinition, NormalizedEvent, WorkflowContext } from "../types/workflow.js";

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
  cryptoPayToken?: string | null;
  cryptoPayUseTestnet?: boolean | null;
  actionType: ExecutablePayload["type"];
  executionPolicy: ExecutionPolicy;
  idempotencyKey: string;
  action: ExecutablePayload;
  queueDelayMs?: number;
  event: NormalizedEvent;
  flowDefinition: FlowDefinition;
  context: {
    trigger: NormalizedEvent["trigger"];
    runtime: WorkflowContext;
    createdAt: string;
  };
};
