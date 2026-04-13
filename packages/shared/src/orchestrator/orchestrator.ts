import { getExecutionPolicy } from "../domain/actions.js";
import { buildIdempotencyKey } from "../domain/idempotency.js";
import { deriveActionsFromFlow, getFrontierActions, listFlowActions } from "../domain/flow.js";
import { createEmptyWorkflowContext, setContextScopeValue } from "../domain/runtime-state.js";
import { logWarn } from "../logging.js";
import { normalizeTelegramUpdate } from "./normalize.js";
import { extractTelegramActor } from "./actors.js";
import type {
  AutomationOrchestrator,
  HandleIncomingUpdateInput,
  HandleIncomingWebhookInput,
  OrchestratorDeps,
  OrchestrationResult,
  RuleRecord
} from "./types.js";
import type { NormalizedEvent, WorkflowContext } from "../types/workflow.js";

function applyCheckpointResume(context: WorkflowContext, checkpoint: { checkpointType?: string; metadata?: Record<string, unknown> }, event: NormalizedEvent) {
  const metadata = checkpoint.metadata ?? {};

  if (checkpoint.checkpointType === "workflow.awaitMessage") {
    const storeAs = typeof metadata.store_as === "string" ? metadata.store_as : null;
    return storeAs ? setContextScopeValue(context, `vars.${storeAs}`, event.text as never) : context;
  }

  if (checkpoint.checkpointType === "workflow.awaitCallback") {
    const storeAs = typeof metadata.store_as === "string" ? metadata.store_as : null;
    return storeAs ? setContextScopeValue(context, `vars.${storeAs}`, (event.callbackData ?? "") as never) : context;
  }

  if (checkpoint.checkpointType === "workflow.collectContact") {
    return {
      ...context,
      customer: {
        ...context.customer,
        phoneNumber: event.contactPhoneNumber ?? context.customer.phoneNumber
      }
    };
  }

  if (checkpoint.checkpointType === "workflow.collectShipping") {
    return {
      ...context,
      order: {
        ...context.order,
        shippingAddress: event.shippingAddress ?? context.order.shippingAddress,
        shippingOptionId: event.shippingOptionId ?? context.order.shippingOptionId,
        status: "awaiting_shipping" as const
      }
    };
  }

  if (checkpoint.checkpointType === "workflow.formStep") {
    const field = typeof metadata.field === "string" ? metadata.field : "";
    const source = typeof metadata.source === "string" ? metadata.source : "text";
    if (!field) {
      return context;
    }

    const value =
      source === "shipping_address"
        ? event.shippingAddress
        : source === "contact_phone"
        ? event.contactPhoneNumber ?? ""
        : source === "contact_payload"
        ? {
            phoneNumber: event.contactPhoneNumber ?? null,
            userId: event.contactUserId ?? null
          }
        : event.text;

    return setContextScopeValue(context, `vars.${field}`, value as never);
  }

  return context;
}

async function enqueueRunActions(input: {
  deps: OrchestratorDeps;
  bot: NonNullable<Awaited<ReturnType<OrchestratorDeps["botRepository"]["findBotContext"]>>>;
  rule: RuleRecord;
  actions: ReturnType<typeof deriveActionsFromFlow>;
  eventId: string;
  event: NormalizedEvent;
  receivedAt: Date;
  context: WorkflowContext;
  resumedFromCheckpointId?: string;
}) {
  const { deps, bot, rule, actions, eventId, event, receivedAt, context, resumedFromCheckpointId } = input;
  if (actions.length === 0) {
    return null;
  }

  const flowNeedsBotToken = listFlowActions(rule.flowDefinition).some((flowAction) => flowAction.payload.type.startsWith("telegram."));
  const flowNeedsCryptoPayToken = listFlowActions(rule.flowDefinition).some((flowAction) => flowAction.payload.type.startsWith("cryptopay."));
  const botToken = flowNeedsBotToken ? deps.decryptToken(bot.encryptedToken) : null;
  const cryptoPayToken = flowNeedsCryptoPayToken && bot.encryptedCryptoPayToken ? deps.decryptToken(bot.encryptedCryptoPayToken) : null;

  const run = await deps.runRepository.createRunWithActions({
    userId: bot.userId,
    botId: bot.botId,
    rule,
    actions,
    eventId,
    eventPayload: event,
    context,
    conversationSessionId: context.session.id,
    customerProfileId: context.customer.id,
    commerceOrderId: context.order.id,
    resumedFromCheckpointId
  });

  for (const actionRun of run.actionRuns) {
    await deps.actionQueue.enqueueAction({
      runId: run.runId,
      ruleId: rule.ruleId,
      actionNodeId: actionRun.actionId,
      actionRunId: actionRun.actionRunId,
      botToken: flowNeedsBotToken ? botToken : null,
      cryptoPayToken: flowNeedsCryptoPayToken ? cryptoPayToken : null,
      cryptoPayUseTestnet: flowNeedsCryptoPayToken ? bot.cryptoPayUseTestnet ?? false : null,
      actionType: actionRun.action.type,
      executionPolicy: getExecutionPolicy(actionRun.action.type),
      idempotencyKey: `${event.eventId}:${actionRun.actionRunId}:${actionRun.action.type}`,
      action: actionRun.action,
      queueDelayMs: actionRun.action.type === "workflow.delay" ? actionRun.action.params.delay_ms : undefined,
      event,
      flowDefinition: rule.flowDefinition,
      context: {
        trigger: event.trigger,
        runtime: context,
        createdAt: receivedAt.toISOString()
      }
    });
  }

  return {
    runId: run.runId,
    queuedActions: run.actionRuns.length
  };
}

async function processRules(
  deps: OrchestratorDeps,
  botContext: Awaited<ReturnType<OrchestratorDeps["botRepository"]["findBotContext"]>>,
  event: NormalizedEvent,
  receivedAt: Date,
  rules: RuleRecord[],
  captureActor?: ReturnType<typeof extractTelegramActor>
): Promise<OrchestrationResult> {
  const bot = botContext;
  if (!bot || bot.status !== "active") {
    return {
      accepted: false,
      reason: "inactive_bot",
      queuedActions: 0,
      runIds: []
    };
  }

  const idempotencyKey = buildIdempotencyKey(bot.botId, event.eventId);

  const eventResult = await deps.eventRepository.createIncomingEvent({
    botId: bot.botId,
    idempotencyKey,
    updateId: event.updateId,
    payload: event,
    receivedAt
  });

  if (eventResult.status === "duplicate") {
    return {
      accepted: true,
      reason: "duplicate_update",
      queuedActions: 0,
      runIds: []
    };
  }

  if (bot.captureUsersEnabled && captureActor) {
    try {
      await deps.botUserRepository.recordInteraction({
        botId: bot.botId,
        actor: captureActor,
        receivedAt
      });
    } catch (error) {
      logWarn("bot_user_capture_failed", {
        botId: bot.botId,
        updateId: event.updateId,
        error
      });
    }
  }

  const limitReached = await deps.entitlementPolicy.isMonthlyExecutionExceeded(bot.userId, bot.plan);
  if (limitReached) {
    return {
      accepted: true,
      reason: "plan_execution_limit",
      queuedActions: 0,
      runIds: []
    };
  }

  let queuedActions = 0;
  const runIds: string[] = [];
  const runtimeRepository =
    deps.runtimeRepository ??
    ({
      async prepareContextForEvent() {
        return {
          context: createEmptyWorkflowContext({
            variables: { ...(event.variables ?? {}) }
          })
        };
      },
      async findMatchingCheckpoint() {
        return null;
      },
      async resolveCheckpoint() {}
    } satisfies OrchestratorDeps["runtimeRepository"]);

  const preparedRuntime = await runtimeRepository.prepareContextForEvent({
    botId: bot.botId,
    event,
    receivedAt
  });
  const runtimeContext = createEmptyWorkflowContext({
    ...preparedRuntime.context,
    variables: {
      ...(event.variables ?? {}),
      ...(preparedRuntime.context.variables ?? {})
    }
  });

  const checkpoint = await runtimeRepository.findMatchingCheckpoint({
    botId: bot.botId,
    event,
    receivedAt
  });

  if (checkpoint) {
    const resumedRule = await deps.ruleRepository.findActiveRuleById(checkpoint.ruleId);
    if (resumedRule) {
      const resumedContext = applyCheckpointResume(runtimeContext, checkpoint, event);
      const resumedFromNodeActions = getFrontierActions(resumedRule.flowDefinition, checkpoint.nodeId, event, resumedContext);
      const result = await enqueueRunActions({
        deps,
        bot,
        rule: resumedRule,
        actions: resumedFromNodeActions,
        eventId: eventResult.eventId,
        event,
        receivedAt,
        context: resumedContext,
        resumedFromCheckpointId: checkpoint.checkpointId
      });

      if (result) {
        await runtimeRepository.resolveCheckpoint({
          checkpointId: checkpoint.checkpointId,
          eventId: eventResult.eventId,
          receivedAt
        });
        queuedActions += result.queuedActions;
        runIds.push(result.runId);
        return {
          accepted: true,
          reason: "processed",
          queuedActions,
          runIds
        };
      }
    }
  }

  for (const rule of rules) {
    const initialActions = deriveActionsFromFlow(rule.flowDefinition, event);
    if (initialActions.length === 0) {
      continue;
    }
    const result = await enqueueRunActions({
      deps,
      bot,
      rule,
      actions: initialActions,
      eventId: eventResult.eventId,
      event,
      receivedAt,
      context: runtimeContext
    });

    if (result) {
      runIds.push(result.runId);
      queuedActions += result.queuedActions;
    }
  }

  return {
    accepted: true,
    reason: "processed",
    queuedActions,
    runIds
  };
}

export function createAutomationOrchestrator(deps: OrchestratorDeps): AutomationOrchestrator {
  return {
    async handleIncomingUpdate(input: HandleIncomingUpdateInput): Promise<OrchestrationResult> {
      const event = normalizeTelegramUpdate(input.telegramUpdate);
      const bot = await deps.botRepository.findBotContext(input.botId);
      const captureActor = bot?.captureUsersEnabled ? extractTelegramActor(input.telegramUpdate) : null;
      const rules = bot ? await deps.ruleRepository.listActiveRules(bot.botId, event.trigger) : [];
      return processRules(deps, bot, event, input.receivedAt, rules, captureActor);
    },

    async handleIncomingWebhook(input: HandleIncomingWebhookInput): Promise<OrchestrationResult> {
      const rule = await deps.ruleRepository.findActiveRuleById(input.ruleId);
      if (!rule) {
        return {
          accepted: false,
          reason: "inactive_bot",
          queuedActions: 0,
          runIds: []
        };
      }

      const bot = await deps.botRepository.findBotContext(rule.botId);
      return processRules(deps, bot, input.event, input.receivedAt, [rule]);
    }
  };
}
