import {
  getTelegramExecutionPolicy,
  isTelegramActionAllowedForTrigger,
  type TelegramActionType,
  type TelegramTriggerType
} from "../telegram/capabilities.js";
import type { ActionType, ExecutionPolicy, TriggerType } from "../types/workflow.js";

export function isActionAllowedForTrigger(actionType: ActionType, trigger: TriggerType): boolean {
  return isTelegramActionAllowedForTrigger(actionType as TelegramActionType, trigger as TelegramTriggerType);
}

export function getExecutionPolicy(actionType: ActionType): ExecutionPolicy {
  return getTelegramExecutionPolicy(actionType as TelegramActionType);
}
