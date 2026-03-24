import { getExecutionPolicy } from "../domain/actions.js";
import { buildIdempotencyKey } from "../domain/idempotency.js";
import { deriveActionsFromFlow } from "../domain/flow.js";
import { normalizeTelegramUpdate } from "./normalize.js";
import type { AutomationOrchestrator, HandleIncomingUpdateInput, OrchestratorDeps, OrchestrationResult } from "./types.js";

export function createAutomationOrchestrator(deps: OrchestratorDeps): AutomationOrchestrator {
  return {
    async handleIncomingUpdate(input: HandleIncomingUpdateInput): Promise<OrchestrationResult> {
      const event = normalizeTelegramUpdate(input.telegramUpdate);

      const bot = await deps.botRepository.findBotContext(input.botId);
      if (!bot || bot.status !== "active") {
        return {
          accepted: false,
          reason: "inactive_bot",
          queuedActions: 0,
          runIds: []
        };
      }

      const idempotencyKey = buildIdempotencyKey(bot.botId, event.updateId);

      const eventResult = await deps.eventRepository.createIncomingEvent({
        botId: bot.botId,
        idempotencyKey,
        updateId: event.updateId,
        payload: event,
        receivedAt: input.receivedAt
      });

      if (eventResult.status === "duplicate") {
        return {
          accepted: true,
          reason: "duplicate_update",
          queuedActions: 0,
          runIds: []
        };
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

      const rules = await deps.ruleRepository.listActiveRules(bot.botId, event.trigger);
      let queuedActions = 0;
      const runIds: string[] = [];
      let botToken: string | null = null;

      for (const rule of rules) {
        const derivedActions = deriveActionsFromFlow(rule.flowDefinition, event);
        if (derivedActions.length === 0) {
          continue;
        }

        const run = await deps.runRepository.createRunWithActions({
          userId: bot.userId,
          botId: bot.botId,
          rule,
          actions: derivedActions,
          eventId: eventResult.eventId,
          eventPayload: event
        });

        runIds.push(run.runId);

        for (const actionRun of run.actionRuns) {
          if (!botToken) {
            botToken = deps.decryptToken(bot.encryptedToken);
          }

          await deps.actionQueue.enqueueAction({
            runId: run.runId,
            actionRunId: actionRun.actionRunId,
            botToken,
            actionType: actionRun.action.type,
            executionPolicy: getExecutionPolicy(actionRun.action.type),
            idempotencyKey: `${event.updateId}:${actionRun.actionRunId}:${actionRun.action.type}`,
            action: actionRun.action,
            event,
            context: {
              trigger: event.trigger,
              variables: event.variables ?? {},
              createdAt: input.receivedAt.toISOString()
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
  };
}
