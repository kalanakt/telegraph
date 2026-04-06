import { getExecutionPolicy } from "../domain/actions.js";
import { buildIdempotencyKey } from "../domain/idempotency.js";
import { deriveActionsFromFlow } from "../domain/flow.js";
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
import type { JsonValue, NormalizedEvent } from "../types/workflow.js";

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
  let botToken: string | null = null;
  const variables: Record<string, JsonValue> = { ...(event.variables ?? {}) };

  for (const rule of rules) {
    const initialActions = deriveActionsFromFlow(rule.flowDefinition, event);
    if (initialActions.length === 0) {
      continue;
    }

    const run = await deps.runRepository.createRunWithActions({
      userId: bot.userId,
      botId: bot.botId,
      rule,
      actions: initialActions,
      eventId: eventResult.eventId,
      eventPayload: event,
      variables
    });

    runIds.push(run.runId);

    for (const actionRun of run.actionRuns) {
      const needsBotToken = actionRun.action.type.startsWith("telegram.");
      if (needsBotToken && !botToken) {
        botToken = deps.decryptToken(bot.encryptedToken);
      }

        await deps.actionQueue.enqueueAction({
          runId: run.runId,
          ruleId: rule.ruleId,
          actionNodeId: actionRun.actionId,
          actionRunId: actionRun.actionRunId,
          botToken: needsBotToken ? botToken : null,
        actionType: actionRun.action.type,
        executionPolicy: getExecutionPolicy(actionRun.action.type),
        idempotencyKey: `${event.eventId}:${actionRun.actionRunId}:${actionRun.action.type}`,
        action: actionRun.action,
        event,
        flowDefinition: rule.flowDefinition,
        context: {
          trigger: event.trigger,
          variables,
          createdAt: receivedAt.toISOString()
        }
      });

      queuedActions += 1;
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
