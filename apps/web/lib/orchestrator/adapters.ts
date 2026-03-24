import { Prisma } from "@prisma/client";
import type { Queue } from "bullmq";
import {
  getExecutionPolicy,
  type ActionJob,
  type ActionPayload,
  type ActionQueue,
  type BotRepository,
  type EntitlementPolicy,
  type EventRepository,
  type FlowDefinition,
  type RuleRepository,
  type RuleRecord,
  type RunRepository,
  flowDefinitionSchema,
  normalizePlanKey,
  PLAN_LIMITS
} from "@telegram-builder/shared";
import { syncSubscriptionMirrorForUser } from "@/lib/clerk-billing";
import { getActionQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2002";
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code?: string }).code === "P2002";
  }

  return false;
}

export function createPrismaBotRepository(prismaClient = prisma): BotRepository {
  return {
    async findBotContext(botId) {
      const bot = await prismaClient.bot.findUnique({
        where: { id: botId },
        include: {
          user: {
            include: {
              subscription: true
            }
          }
        }
      });

      if (!bot) {
        return null;
      }

      const synced = await syncSubscriptionMirrorForUser({
        appUserId: bot.user.id,
        clerkUserId: bot.user.clerkUserId,
        fallbackPlan: bot.user.subscription?.plan,
        fallbackStatus: bot.user.subscription?.status
      });

      return {
        botId: bot.id,
        userId: bot.userId,
        encryptedToken: bot.encryptedToken,
        status: bot.status,
        plan: normalizePlanKey(synced.plan)
      };
    }
  };
}

export function createPrismaRuleRepository(prismaClient = prisma): RuleRepository {
  return {
    async listActiveRules(botId, trigger) {
      const rules = await prismaClient.workflowRule.findMany({
        where: {
          botId,
          enabled: true,
          trigger: trigger as never
        }
      });

      return rules.map(
        (rule): RuleRecord => ({
          ruleId: rule.id,
          trigger: rule.trigger,
          flowDefinition: flowDefinitionSchema.parse(rule.flowDefinition) as FlowDefinition
        })
      );
    }
  };
}

export function createPrismaEventRepository(prismaClient = prisma): EventRepository {
  return {
    async createIncomingEvent(input) {
      try {
        const event = await prismaClient.incomingEvent.create({
          data: {
            botId: input.botId,
            idempotencyKey: input.idempotencyKey,
            updateId: input.updateId,
            payload: input.payload as unknown as object
          }
        });

        return {
          status: "created" as const,
          eventId: event.id
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return {
            status: "duplicate" as const
          };
        }

        throw error;
      }
    }
  };
}

export function createPrismaRunRepository(prismaClient = prisma): RunRepository {
  return {
    async createRunWithActions(input) {
      const run = await prismaClient.workflowRun.create({
        data: {
          userId: input.userId,
          botId: input.botId,
          ruleId: input.rule.ruleId,
          eventId: input.eventId,
          status: "queued",
          trigger: input.eventPayload.trigger,
          eventPayload: input.eventPayload as unknown as object
        }
      });

      const actionRuns = await Promise.all(
        input.actions.map((flowAction) =>
          prismaClient.actionRun.create({
            data: {
              workflowRunId: run.id,
              actionId: flowAction.actionId,
              type: flowAction.payload.type,
              payload: {
                ...flowAction.payload,
                executionPolicy: getExecutionPolicy(flowAction.payload.type)
              } as unknown as object,
              status: "pending"
            }
          })
        )
      );

      return {
        runId: run.id,
        actionRuns: actionRuns.map((actionRun, index) => {
          const source = input.actions[index];
          if (!source) {
            throw new Error("Missing source action for action run");
          }

          return {
            actionRunId: actionRun.id,
            action: source.payload as ActionPayload
          };
        })
      };
    }
  };
}

type QueueWriter = Pick<Queue<ActionJob>, "add">;

export function createBullMqActionQueueAdapter(queue: QueueWriter = getActionQueue()): ActionQueue {
  return {
    async enqueueAction(job: ActionJob) {
      await queue.add(`action:${job.actionType}`, job, {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: false
      });
    }
  };
}

export function createPrismaEntitlementPolicy(prismaClient = prisma): EntitlementPolicy {
  return {
    async isMonthlyExecutionExceeded(userId, plan) {
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);

      const next = new Date(start);
      next.setUTCMonth(next.getUTCMonth() + 1);

      const count = await prismaClient.workflowRun.count({
        where: {
          userId,
          createdAt: {
            gte: start,
            lt: next
          }
        }
      });

      return count >= PLAN_LIMITS[plan].monthlyExecutions;
    }
  };
}
