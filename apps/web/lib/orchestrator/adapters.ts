import { Prisma } from "@prisma/client";
import type { JobsOptions } from "bullmq";
import * as Sentry from "@sentry/nextjs";
import {
  decrypt,
  encrypt,
  getExecutionPolicy,
  isLegacyEncryptedPayload,
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
import { getActionQueue, type ActionJobName } from "@/lib/queue";
import { prisma } from "@/lib/prisma";

function serializePrismaJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrismaJsonValue(item));
  }

  if (typeof value === "object") {
    if ("toJSON" in value && typeof value.toJSON === "function") {
      return serializePrismaJsonValue(value.toJSON());
    }

    const result: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, nested] of Object.entries(value)) {
      if (nested !== undefined) {
        result[key] = serializePrismaJsonValue(nested);
      }
    }

    return result as Prisma.InputJsonObject;
  }

  throw new TypeError("Value cannot be serialized to Prisma JSON");
}

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonObject {
  const serialized = serializePrismaJsonValue(value);
  if (!serialized || Array.isArray(serialized) || typeof serialized !== "object") {
    throw new TypeError("Expected a JSON object");
  }
  return serialized as Prisma.InputJsonObject;
}

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
              subscription: {
                select: {
                  plan: true,
                  status: true
                }
              }
            }
          }
        }
      });

      if (!bot) {
        return null;
      }

      let encryptedToken = bot.encryptedToken;
      if (isLegacyEncryptedPayload(bot.encryptedToken)) {
        const rotatedToken = encrypt(decrypt(bot.encryptedToken));
        await prismaClient.bot.update({
          where: { id: bot.id },
          data: {
            encryptedToken: rotatedToken
          }
        });
        encryptedToken = rotatedToken;
      }

      return {
        botId: bot.id,
        userId: bot.userId,
        encryptedToken,
        status: bot.status,
        plan: normalizePlanKey(bot.user.subscription?.plan)
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
            payload: toPrismaJson(input.payload)
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
      const runInTransaction = async (tx: typeof prismaClient) => {
        const run = await tx.workflowRun.create({
          data: {
            userId: input.userId,
            botId: input.botId,
            ruleId: input.rule.ruleId,
            eventId: input.eventId,
            status: "queued",
            trigger: input.eventPayload.trigger,
            eventPayload: toPrismaJson(input.eventPayload)
          }
        });

        const actionRuns = await Promise.all(
          input.actions.map((flowAction) =>
            tx.actionRun.create({
              data: {
                workflowRunId: run.id,
                actionId: flowAction.actionId,
                type: flowAction.payload.type,
                payload: toPrismaJson({
                  ...flowAction.payload,
                  executionPolicy: getExecutionPolicy(flowAction.payload.type)
                }),
                status: "pending"
              }
            })
          )
        );

        return { run, actionRuns };
      };

      const result =
        "$transaction" in prismaClient && typeof prismaClient.$transaction === "function"
          ? await prismaClient.$transaction(async (tx) => runInTransaction(tx as typeof prismaClient))
          : await runInTransaction(prismaClient);

      const run = result.run;
      const actionRuns = result.actionRuns;

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

type QueueWriter = {
  add(name: ActionJobName, data: ActionJob, opts?: JobsOptions): Promise<unknown>;
};

export function createBullMqActionQueueAdapter(queue?: QueueWriter | null): ActionQueue {
  const queueWriter: QueueWriter = queue ?? (getActionQueue() as unknown as QueueWriter);

  return {
    async enqueueAction(job: ActionJob) {
      const jobName: ActionJobName = `action:${job.actionType}`;

      try {
        await queueWriter.add(jobName, job, {
          jobId: job.idempotencyKey,
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: false
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            area: "action-queue-write",
            queue: "actions"
          },
          extra: {
            actionRunId: job.actionRunId,
            actionType: job.actionType,
            runId: job.runId
          }
        });
        throw error;
      }
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
