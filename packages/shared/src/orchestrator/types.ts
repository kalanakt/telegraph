import type { PlanKey } from "../config/limits.js";
import type { ActionJob } from "../queue/contracts.js";
import type { TelegramUpdate } from "../types/telegram.js";
import type { ExecutablePayload, FlowDefinition, JsonValue, NormalizedEvent, SessionCheckpointStatus, TriggerType, WorkflowContext } from "../types/workflow.js";
import type { TelegramActor } from "./actors.js";

export type OrchestrationReason =
  | "inactive_bot"
  | "duplicate_update"
  | "plan_execution_limit"
  | "processed";

export type HandleIncomingUpdateInput = {
  botId: string;
  telegramUpdate: TelegramUpdate;
  receivedAt: Date;
};

export type HandleIncomingEventInput = {
  botId: string;
  event: NormalizedEvent;
  receivedAt: Date;
};

export type HandleIncomingWebhookInput = {
  ruleId: string;
  event: NormalizedEvent;
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
  encryptedCryptoPayToken?: string | null;
  cryptoPayUseTestnet?: boolean;
  status: string;
  plan: PlanKey;
  captureUsersEnabled: boolean;
};

export type RuleRecord = {
  ruleId: string;
  botId: string;
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
  findActiveRuleById(ruleId: string): Promise<RuleRecord | null>;
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

export interface BotUserRepository {
  recordInteraction(input: {
    botId: string;
    actor: TelegramActor;
    receivedAt: Date;
  }): Promise<void>;
}

export interface RunRepository {
  createRunWithActions(input: {
    userId: string;
    botId: string;
    rule: RuleRecord;
    actions: Array<{
      actionId: string;
      payload: ExecutablePayload;
    }>;
    eventId: string;
    eventPayload: NormalizedEvent;
    context: WorkflowContext;
    conversationSessionId?: string;
    customerProfileId?: string;
    commerceOrderId?: string;
    resumedFromCheckpointId?: string;
  }): Promise<{
    runId: string;
    actionRuns: Array<{
      actionId: string;
      actionRunId: string;
      action: ExecutablePayload;
    }>;
  }>;
}

export type RuntimeCheckpointRecord = {
  checkpointId: string;
  ruleId: string;
  nodeId: string;
  checkpointType: string;
  status: SessionCheckpointStatus;
  sessionId: string;
  flowDefinition: FlowDefinition;
  botId: string;
  metadata: Record<string, JsonValue>;
};

export type PreparedRuntimeContext = {
  sessionId?: string;
  customerProfileId?: string;
  commerceOrderId?: string;
  context: WorkflowContext;
};

export interface RuntimeRepository {
  prepareContextForEvent(input: {
    botId: string;
    event: NormalizedEvent;
    receivedAt: Date;
  }): Promise<PreparedRuntimeContext>;
  findMatchingCheckpoint(input: {
    botId: string;
    event: NormalizedEvent;
    receivedAt: Date;
  }): Promise<RuntimeCheckpointRecord | null>;
  resolveCheckpoint(input: {
    checkpointId: string;
    eventId: string;
    receivedAt: Date;
  }): Promise<void>;
}

export interface ActionQueue {
  enqueueAction(job: ActionJob): Promise<void>;
}

export interface EntitlementPolicy {
  isMonthlyExecutionExceeded(userId: string, plan: PlanKey): Promise<boolean>;
}

export type OrchestratorDeps = {
  botRepository: BotRepository;
  botUserRepository: BotUserRepository;
  ruleRepository: RuleRepository;
  eventRepository: EventRepository;
  runRepository: RunRepository;
  runtimeRepository: RuntimeRepository;
  actionQueue: ActionQueue;
  entitlementPolicy: EntitlementPolicy;
  decryptToken: (encryptedToken: string) => string;
};

export interface AutomationOrchestrator {
  handleIncomingUpdate(input: HandleIncomingUpdateInput): Promise<OrchestrationResult>;
  handleIncomingEvent(input: HandleIncomingEventInput): Promise<OrchestrationResult>;
  handleIncomingWebhook(input: HandleIncomingWebhookInput): Promise<OrchestrationResult>;
}
