import { Prisma } from "@prisma/client";
import type { JobsOptions } from "bullmq";
import * as Sentry from "@sentry/nextjs";
import {
  createEmptyWorkflowContext,
  decrypt,
  encrypt,
  getExecutionPolicy,
  isLegacyEncryptedPayload,
  type ActionJob,
  type ActionQueue,
  type BotRepository,
  type BotUserRepository,
  type ExecutablePayload,
  type EntitlementPolicy,
  type EventRepository,
  type FlowDefinition,
  type RuleRepository,
  type RuleRecord,
  type RuntimeRepository,
  type RunRepository,
  type WorkflowContext,
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

function toPrismaJson(value: unknown): Prisma.InputJsonObject {
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

function toTelegramUserId(value: number | undefined): bigint | null {
  return typeof value === "number" ? BigInt(value) : null;
}

function toRuntimeContext(value: unknown): WorkflowContext {
  if (!value || typeof value !== "object") {
    return createEmptyWorkflowContext();
  }

  const record = value as Record<string, unknown>;
  return createEmptyWorkflowContext({
    variables: (record.variables as WorkflowContext["variables"] | undefined) ?? {},
    session: (record.session as WorkflowContext["session"] | undefined) ?? {},
    customer: (record.customer as WorkflowContext["customer"] | undefined) ?? {},
    order: (record.order as WorkflowContext["order"] | undefined) ?? {}
  });
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
        encryptedCryptoPayToken: bot.encryptedCryptoPayToken,
        cryptoPayUseTestnet: bot.cryptoPayUseTestnet,
        status: bot.status,
        plan: normalizePlanKey(bot.user.subscription?.plan),
        captureUsersEnabled: bot.captureUsersEnabled
      };
    }
  };
}

export function createPrismaBotUserRepository(prismaClient = prisma): BotUserRepository {
  return {
    async recordInteraction(input) {
      await prismaClient.botUser.upsert({
        where: {
          botId_telegramUserId: {
            botId: input.botId,
            telegramUserId: BigInt(input.actor.id)
          }
        },
        create: {
          botId: input.botId,
          telegramUserId: BigInt(input.actor.id),
          username: input.actor.username ?? null,
          firstName: input.actor.first_name ?? null,
          lastName: input.actor.last_name ?? null,
          languageCode: input.actor.language_code ?? null,
          firstSeenAt: input.receivedAt,
          lastSeenAt: input.receivedAt,
          interactionCount: 1
        },
        update: {
          username: input.actor.username ?? undefined,
          firstName: input.actor.first_name ?? undefined,
          lastName: input.actor.last_name ?? undefined,
          languageCode: input.actor.language_code ?? undefined,
          lastSeenAt: input.receivedAt,
          interactionCount: {
            increment: 1
          }
        }
      });
    }
  };
}

export function createPrismaRuleRepository(prismaClient = prisma): RuleRepository {
  function mapRule(rule: { id: string; botId: string; trigger: string; flowDefinition: unknown }): RuleRecord {
    return {
      ruleId: rule.id,
      botId: rule.botId,
      trigger: rule.trigger as RuleRecord["trigger"],
      flowDefinition: flowDefinitionSchema.parse(rule.flowDefinition) as FlowDefinition
    };
  }

  return {
    async listActiveRules(botId, trigger) {
      const rules = await prismaClient.workflowRule.findMany({
        where: {
          botId,
          enabled: true,
          trigger
        }
      });

      return rules.map(mapRule);
    },
    async findActiveRuleById(ruleId) {
      const rule = await prismaClient.workflowRule.findFirst({
        where: {
          id: ruleId,
          enabled: true
        }
      });

      return rule ? mapRule(rule) : null;
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
            conversationSessionId: input.conversationSessionId ?? null,
            customerProfileId: input.customerProfileId ?? null,
            commerceOrderId: input.commerceOrderId ?? null,
            resumedFromCheckpointId: input.resumedFromCheckpointId ?? null,
            status: "queued",
            trigger: input.eventPayload.trigger,
            eventPayload: toPrismaJson(input.eventPayload),
            contextVariables: toPrismaJson(input.context ?? createEmptyWorkflowContext())
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
            actionId: source.actionId,
            actionRunId: actionRun.id,
            action: source.payload as ExecutablePayload
          };
        })
      };
    }
  };
}

function checkpointMatchesEvent(
  checkpointType: string,
  metadata: Record<string, unknown>,
  event: {
    trigger: string;
    callbackData?: string;
    hasContact?: boolean;
    contactPhoneNumber?: string;
  }
) {
  if (checkpointType === "workflow.awaitMessage") {
    return ["message_received", "message_edited", "command_received"].includes(event.trigger);
  }

  if (checkpointType === "workflow.awaitCallback") {
    if (event.trigger !== "callback_query_received") {
      return false;
    }
    const prefix = typeof metadata.callback_prefix === "string" ? metadata.callback_prefix : "";
    return !prefix || (event.callbackData ?? "").startsWith(prefix);
  }

  if (checkpointType === "workflow.collectContact") {
    return Boolean(event.hasContact || event.contactPhoneNumber);
  }

  if (checkpointType === "workflow.collectShipping") {
    return event.trigger === "shipping_query_received";
  }

  if (checkpointType === "workflow.formStep") {
    const source = typeof metadata.source === "string" ? metadata.source : "text";
    if (source === "shipping_address") {
      return event.trigger === "shipping_query_received";
    }
    if (source === "contact_phone" || source === "contact_payload") {
      return Boolean(event.hasContact || event.contactPhoneNumber);
    }
    return ["message_received", "message_edited", "command_received"].includes(event.trigger);
  }

  return false;
}

export function createPrismaRuntimeRepository(prismaClient = prisma): RuntimeRepository {
  return {
    async prepareContextForEvent(input) {
      const telegramUserId = toTelegramUserId(input.event.fromUserId);
      const chatId = input.event.chatId ?? null;

      const customer =
        telegramUserId === null
          ? null
          : await prismaClient.customerProfile.upsert({
              where: {
                botId_telegramUserId: {
                  botId: input.botId,
                  telegramUserId
                }
              },
              create: {
                botId: input.botId,
                telegramUserId,
                chatId,
                username: input.event.fromUsername ?? null,
                tags: [],
                attributes: {},
                lastInteractionAt: input.receivedAt
              },
              update: {
                chatId: chatId ?? undefined,
                username: input.event.fromUsername ?? undefined,
                lastInteractionAt: input.receivedAt
              }
            });

      const session =
        !chatId || telegramUserId === null
          ? null
          : await prismaClient.conversationSession.upsert({
              where: {
                botId_chatId_telegramUserId: {
                  botId: input.botId,
                  chatId,
                  telegramUserId
                }
              },
              create: {
                botId: input.botId,
                chatId,
                telegramUserId,
                customerProfileId: customer?.id ?? null,
                status: "ACTIVE",
                context: createEmptyWorkflowContext(),
                startedAt: input.receivedAt,
                lastEventAt: input.receivedAt
              },
              update: {
                customerProfileId: customer?.id ?? undefined,
                lastEventAt: input.receivedAt
              }
            });

      let order =
        input.event.invoicePayload
          ? await prismaClient.commerceOrder.findFirst({
              where: {
                botId: input.botId,
                invoicePayload: input.event.invoicePayload
              },
              orderBy: { updatedAt: "desc" }
            })
          : null;

      if (!order && session?.id) {
        order = await prismaClient.commerceOrder.findFirst({
          where: {
            botId: input.botId,
            sessionId: session.id,
            status: {
              in: ["draft", "awaiting_shipping", "awaiting_payment", "paid"]
            }
          },
          orderBy: { updatedAt: "desc" }
        });
      }

      if (order && (input.event.shippingQueryId || input.event.preCheckoutQueryId || input.event.successfulPaymentChargeId)) {
        order = await prismaClient.commerceOrder.update({
          where: { id: order.id },
          data: {
            shippingOptionId: input.event.shippingOptionId ?? undefined,
            shippingAddress: input.event.shippingAddress ? (input.event.shippingAddress as never) : undefined,
            orderInfo: input.event.orderInfo ? (input.event.orderInfo as never) : undefined,
            currency: input.event.currency ?? undefined,
            totalAmount: input.event.totalAmount ?? undefined,
            status: input.event.successfulPaymentChargeId
              ? "paid"
              : input.event.preCheckoutQueryId
              ? "awaiting_payment"
              : input.event.shippingQueryId
              ? "awaiting_shipping"
              : undefined
          }
        });
      }

      const stored = toRuntimeContext(session?.context);
      return {
        sessionId: session?.id,
        customerProfileId: customer?.id,
        commerceOrderId: order?.id,
        context: createEmptyWorkflowContext({
          variables: stored.variables,
          session: {
            ...stored.session,
            ...(session
              ? {
                  id: session.id,
                  botId: session.botId,
                  chatId: session.chatId,
                  telegramUserId: session.telegramUserId?.toString(),
                  customerProfileId: session.customerProfileId ?? undefined,
                  status: session.status,
                  handoffOwner: session.handoffOwner ?? undefined,
                  handoffNote: session.handoffNote ?? undefined,
                  context: ((session.context as Record<string, unknown> | null) ?? {}) as WorkflowContext["session"]["context"]
                }
              : {})
          },
          customer: {
            ...stored.customer,
            ...(customer
              ? {
                  id: customer.id,
                  botId: customer.botId,
                  telegramUserId: customer.telegramUserId.toString(),
                  chatId: customer.chatId ?? undefined,
                  username: customer.username ?? undefined,
                  firstName: customer.firstName ?? undefined,
                  lastName: customer.lastName ?? undefined,
                  languageCode: customer.languageCode ?? undefined,
                  phoneNumber: customer.phoneNumber ?? undefined,
                  email: customer.email ?? undefined,
                  tags: customer.tags as unknown as WorkflowContext["customer"]["tags"],
                  attributes: ((customer.attributes as Record<string, unknown> | null) ?? {}) as WorkflowContext["customer"]["attributes"]
                }
              : {})
          },
          order: {
            ...stored.order,
            ...(order
              ? {
                  id: order.id,
                  botId: order.botId,
                  sessionId: order.sessionId ?? undefined,
                  customerProfileId: order.customerProfileId ?? undefined,
                  latestWorkflowRunId: order.latestWorkflowRunId ?? undefined,
                  externalId: order.externalId ?? undefined,
                  invoicePayload: order.invoicePayload ?? undefined,
                  currency: order.currency ?? undefined,
                  totalAmount: order.totalAmount ?? undefined,
                  shippingOptionId: order.shippingOptionId ?? undefined,
                  shippingAddress: order.shippingAddress as unknown as WorkflowContext["order"]["shippingAddress"],
                  orderInfo: order.orderInfo as unknown as WorkflowContext["order"]["orderInfo"],
                  attributes: ((order.attributes as Record<string, unknown> | null) ?? {}) as WorkflowContext["order"]["attributes"],
                  status: order.status
                }
              : {})
          }
        })
      };
    },

    async findMatchingCheckpoint(input) {
      const telegramUserId = toTelegramUserId(input.event.fromUserId);
      const chatId = input.event.chatId ?? null;
      if (!chatId || telegramUserId === null) {
        return null;
      }

      const session = await prismaClient.conversationSession.findUnique({
        where: {
          botId_chatId_telegramUserId: {
            botId: input.botId,
            chatId,
            telegramUserId
          }
        }
      });

      if (!session || session.status !== "ACTIVE") {
        return null;
      }

      const checkpoints = await prismaClient.sessionCheckpoint.findMany({
        where: {
          sessionId: session.id,
          status: "OPEN"
        },
        include: {
          rule: true
        },
        orderBy: { createdAt: "asc" }
      });

      for (const checkpoint of checkpoints) {
        if (checkpoint.expiresAt && checkpoint.expiresAt <= input.receivedAt) {
          await prismaClient.sessionCheckpoint.update({
            where: { id: checkpoint.id },
            data: {
              status: "EXPIRED",
              resolvedAt: input.receivedAt
            }
          });
          continue;
        }

        const metadata =
          checkpoint.metadata && typeof checkpoint.metadata === "object"
            ? (checkpoint.metadata as Record<string, unknown>)
            : {};

        if (!checkpointMatchesEvent(checkpoint.checkpointType, metadata, input.event)) {
          continue;
        }

        return {
          checkpointId: checkpoint.id,
          ruleId: checkpoint.ruleId,
          nodeId: checkpoint.nodeId,
          checkpointType: checkpoint.checkpointType,
          status: checkpoint.status,
          sessionId: checkpoint.sessionId,
          flowDefinition: flowDefinitionSchema.parse(checkpoint.rule.flowDefinition) as FlowDefinition,
          botId: checkpoint.rule.botId,
          metadata: metadata as unknown as import("@telegram-builder/shared").RuntimeCheckpointRecord["metadata"]
        };
      }

      return null;
    },

    async resolveCheckpoint(input) {
      const checkpoint = await prismaClient.sessionCheckpoint.update({
        where: { id: input.checkpointId },
        data: {
          status: "RESUMED",
          resolvedAt: input.receivedAt,
          resumeEventId: input.eventId
        },
        select: {
          sessionId: true
        }
      });

      await prismaClient.conversationSession.update({
        where: { id: checkpoint.sessionId },
        data: {
          lastEventAt: input.receivedAt,
          status: "ACTIVE"
        }
      });
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
      const delay = typeof job.queueDelayMs === "number" && job.queueDelayMs > 0
        ? { delay: job.queueDelayMs }
        : {};

      try {
        await queueWriter.add(jobName, job, {
          jobId: job.idempotencyKey,
          attempts: 5,
          ...delay,
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
