import {
  getTelegramExecutionPolicy,
  isTelegramActionAllowedForTrigger,
  type TelegramActionType,
  type TelegramTriggerType
} from "../telegram/capabilities.js";
import type { ActionType, ExecutionPolicy, TriggerType } from "../types/workflow.js";
import { WORKFLOW_ACTION_MANIFEST } from "../workflow/capabilities.js";

const ACTION_POLICIES = new Map<ActionType, ExecutionPolicy>(
  WORKFLOW_ACTION_MANIFEST.map((item) => [item.actionType, item.executionPolicy])
);

const INTERNAL_ACTION_POLICIES: Partial<Record<ActionType, ExecutionPolicy>> = {
  "workflow.setVariable": {
    retryClass: "permanent",
    timeoutMs: 2_000,
    idempotencyKeyStrategy: "action_run",
    rateLimitBucket: "workflow.internal"
  },
  "workflow.delay": {
    retryClass: "permanent",
    timeoutMs: 2_000,
    idempotencyKeyStrategy: "action_run",
    rateLimitBucket: "workflow.internal"
  }
};

export function isActionAllowedForTrigger(actionType: ActionType, trigger: TriggerType): boolean {
  if (actionType.startsWith("telegram.")) {
    return isTelegramActionAllowedForTrigger(actionType as TelegramActionType, trigger as TelegramTriggerType);
  }

  return true;
}

export function getExecutionPolicy(actionType: ActionType): ExecutionPolicy {
  if (actionType.startsWith("telegram.")) {
    return getTelegramExecutionPolicy(actionType as TelegramActionType);
  }

  return (
    INTERNAL_ACTION_POLICIES[actionType] ??
    ACTION_POLICIES.get(actionType) ?? {
      retryClass: "transient",
      timeoutMs: 15_000,
      idempotencyKeyStrategy: "action_run",
      rateLimitBucket: "workflow.default"
    }
  );
}
