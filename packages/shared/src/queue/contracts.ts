import type { ActionPayload, ExecutionPolicy, NormalizedEvent } from "../types/workflow.js";

export const QUEUES = {
  ACTIONS: "actions",
  DEAD_LETTER: "dead-letter"
} as const;

export type ActionJob = {
  runId: string;
  actionRunId: string;
  botToken: string;
  actionType: ActionPayload["type"];
  executionPolicy: ExecutionPolicy;
  idempotencyKey: string;
  action: ActionPayload;
  event: NormalizedEvent;
  context: {
    trigger: NormalizedEvent["trigger"];
    variables: Record<string, string>;
    createdAt: string;
  };
};
