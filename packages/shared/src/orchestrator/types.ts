import type { PlanKey } from "../config/limits.js";
import type { ActionJob } from "../queue/contracts.js";
import type { TelegramUpdate } from "../types/telegram.js";
import type { ActionPayload, FlowDefinition, NormalizedEvent, TriggerType } from "../types/workflow.js";

export type OrchestrationReason =
  | "inactive_bot"
  | "unsupported_update"
  | "duplicate_update"
  | "plan_execution_limit"
  | "processed";

export type HandleIncomingUpdateInput = {
  botId: string;
  telegramUpdate: TelegramUpdate;
  receivedAt: Date;
};

export type OrchestrationResult = {
  accepted: boolean;
  reason: OrchestrationReason;
  queuedActions: number;
  runIds: string[];
};

export type BotContext = {
  botId: string;
  userId: string;
  encryptedToken: string;
  status: string;
  plan: PlanKey;
};

export type RuleRecord = {
  ruleId: string;
  trigger: TriggerType;
  flowDefinition: FlowDefinition;
};

export type CreatedEvent = {
  status: "created";
  eventId: string;
};

export type DuplicateEvent = {
  status: "duplicate";
};

export interface BotRepository {
  findBotContext(botId: string): Promise<BotContext | null>;
}

export interface RuleRepository {
  listActiveRules(botId: string, trigger: TriggerType): Promise<RuleRecord[]>;
}

export interface EventRepository {
  createIncomingEvent(input: {
    botId: string;
    idempotencyKey: string;
    updateId: number;
    payload: NormalizedEvent;
    receivedAt: Date;
  }): Promise<CreatedEvent | DuplicateEvent>;
}

export interface RunRepository {
  createRunWithActions(input: {
    userId: string;
    botId: string;
    rule: RuleRecord;
    actions: Array<{
      actionId: string;
      payload: ActionPayload;
    }>;
    eventId: string;
    eventPayload: NormalizedEvent;
  }): Promise<{
    runId: string;
    actionRuns: Array<{
      actionRunId: string;
      action: ActionPayload;
    }>;
  }>;
}

export interface ActionQueue {
  enqueueAction(job: ActionJob): Promise<void>;
}

export interface EntitlementPolicy {
  isMonthlyExecutionExceeded(userId: string, plan: PlanKey): Promise<boolean>;
}

export type OrchestratorDeps = {
  botRepository: BotRepository;
  ruleRepository: RuleRepository;
  eventRepository: EventRepository;
  runRepository: RunRepository;
  actionQueue: ActionQueue;
  entitlementPolicy: EntitlementPolicy;
  decryptToken: (encryptedToken: string) => string;
};

export interface AutomationOrchestrator {
  handleIncomingUpdate(input: HandleIncomingUpdateInput): Promise<OrchestrationResult>;
}
