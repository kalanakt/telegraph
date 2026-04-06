import { describe, expect, it } from "vitest";
import {
  createBullMqActionQueueAdapter,
  createPrismaBotUserRepository,
  createPrismaEventRepository,
  createPrismaRunRepository
} from "../../apps/web/lib/orchestrator/adapters";

describe("orchestrator adapters", () => {
  it("queue adapter applies retry/backoff options", async () => {
    const calls: Array<{ name: string; payload: unknown; options: unknown }> = [];

    const adapter = createBullMqActionQueueAdapter({
      async add(name: string, payload: unknown, options: unknown) {
        calls.push({ name, payload, options });
      }
    } as { add: (name: string, payload: unknown, options: unknown) => Promise<void> });

    await adapter.enqueueAction({
      runId: "run_1",
      actionRunId: "action_run_1",
      botToken: "token",
      actionType: "telegram.sendMessage",
      executionPolicy: {
        retryClass: "transient",
        timeoutMs: 10000,
        idempotencyKeyStrategy: "event_and_action",
        rateLimitBucket: "telegram.write"
      },
      idempotencyKey: "1:action_run_1:telegram.sendMessage",
      action: { type: "telegram.sendMessage", params: { chat_id: "123", text: "hello" } },
      event: {
        trigger: "message_received",
        updateId: 1,
        chatId: "123",
        chatType: "private",
        messageSource: "user",
        text: "hello",
        variables: {}
      },
      context: {
        trigger: "message_received",
        variables: {},
        createdAt: new Date().toISOString()
      }
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe("action:telegram.sendMessage");
    expect(calls[0].options).toEqual({
      jobId: "1:action_run_1:telegram.sendMessage",
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: false
    });
  });

  it("event repository returns duplicate on unique-constraint error", async () => {
    const repository = createPrismaEventRepository({
      incomingEvent: {
        async create() {
          throw { code: "P2002" };
        }
      }
    } as { incomingEvent: { create: () => Promise<unknown> } });

    const result = await repository.createIncomingEvent({
      botId: "bot_1",
      idempotencyKey: "key_1",
      updateId: 1,
      payload: {
        trigger: "message_received",
        updateId: 1,
        chatId: "1",
        chatType: "private",
        messageSource: "user",
        text: "hello",
        variables: {}
      },
      receivedAt: new Date()
    });

    expect(result).toEqual({ status: "duplicate" });
  });

  it("run repository creates run and action runs with mapped ids", async () => {
    const workflowRunCreateCalls: unknown[] = [];
    const actionRunCreateCalls: unknown[] = [];

    const repository = createPrismaRunRepository({
      workflowRun: {
        async create(args: unknown) {
          workflowRunCreateCalls.push(args);
          return { id: "run_123" };
        }
      },
      actionRun: {
        async create(args: unknown) {
          actionRunCreateCalls.push(args);
          const index = actionRunCreateCalls.length;
          return { id: `action_run_${index}` };
        }
      }
    } as {
      workflowRun: { create: (args: unknown) => Promise<{ id: string }> };
      actionRun: { create: (args: unknown) => Promise<{ id: string }> };
    });

    const result = await repository.createRunWithActions({
      userId: "user_1",
      botId: "bot_1",
      eventId: "evt_1",
      eventPayload: {
        source: "telegram",
        eventId: "1",
        trigger: "message_received",
        updateId: 1,
        chatId: "1",
        chatType: "private",
        messageSource: "user",
        text: "hello",
        variables: {}
      },
      rule: {
        ruleId: "rule_1",
        botId: "bot_1",
        trigger: "message_received",
        flowDefinition: {
          nodes: [{ id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} }],
          edges: []
        }
      },
      actions: [{ actionId: "a1", payload: { type: "telegram.sendMessage", params: { chat_id: "1", text: "reply" } } }],
      variables: {}
    });

    expect(workflowRunCreateCalls).toHaveLength(1);
    expect(actionRunCreateCalls).toHaveLength(1);
    expect(result).toEqual({
      runId: "run_123",
      actionRuns: [{ actionId: "a1", actionRunId: "action_run_1", action: { type: "telegram.sendMessage", params: { chat_id: "1", text: "reply" } } }]
    });
  });

  it("bot-user repository creates a bot-scoped user record on first interaction", async () => {
    const upsertCalls: unknown[] = [];

    const repository = createPrismaBotUserRepository({
      botUser: {
        async upsert(args: unknown) {
          upsertCalls.push(args);
          return { id: "bot_user_1" };
        }
      }
    } as {
      botUser: { upsert: (args: unknown) => Promise<{ id: string }> };
    });

    const receivedAt = new Date("2026-04-06T10:00:00.000Z");

    await repository.recordInteraction({
      botId: "bot_1",
      actor: {
        id: 123,
        username: "alice",
        first_name: "Alice",
        last_name: "Doe",
        language_code: "en"
      },
      receivedAt
    });

    expect(upsertCalls).toEqual([
      {
        where: {
          botId_telegramUserId: {
            botId: "bot_1",
            telegramUserId: BigInt(123)
          }
        },
        create: {
          botId: "bot_1",
          telegramUserId: BigInt(123),
          username: "alice",
          firstName: "Alice",
          lastName: "Doe",
          languageCode: "en",
          firstSeenAt: receivedAt,
          lastSeenAt: receivedAt,
          interactionCount: 1
        },
        update: {
          username: "alice",
          firstName: "Alice",
          lastName: "Doe",
          languageCode: "en",
          lastSeenAt: receivedAt,
          interactionCount: {
            increment: 1
          }
        }
      }
    ]);
  });

  it("bot-user repository preserves stored fields when a later interaction omits them", async () => {
    const upsertCalls: unknown[] = [];

    const repository = createPrismaBotUserRepository({
      botUser: {
        async upsert(args: unknown) {
          upsertCalls.push(args);
          return { id: "bot_user_1" };
        }
      }
    } as {
      botUser: { upsert: (args: unknown) => Promise<{ id: string }> };
    });

    const receivedAt = new Date("2026-04-06T12:00:00.000Z");

    await repository.recordInteraction({
      botId: "bot_1",
      actor: {
        id: 123
      },
      receivedAt
    });

    expect(upsertCalls[0]).toEqual({
      where: {
        botId_telegramUserId: {
          botId: "bot_1",
          telegramUserId: BigInt(123)
        }
      },
      create: {
        botId: "bot_1",
        telegramUserId: BigInt(123),
        username: null,
        firstName: null,
        lastName: null,
        languageCode: null,
        firstSeenAt: receivedAt,
        lastSeenAt: receivedAt,
        interactionCount: 1
      },
      update: {
        username: undefined,
        firstName: undefined,
        lastName: undefined,
        languageCode: undefined,
        lastSeenAt: receivedAt,
        interactionCount: {
          increment: 1
        }
      }
    });
  });

  it("bot-user repository scopes the same Telegram user id to each bot independently", async () => {
    const upsertCalls: Array<{ where: { botId_telegramUserId: { botId: string; telegramUserId: bigint } } }> = [];

    const repository = createPrismaBotUserRepository({
      botUser: {
        async upsert(args: { where: { botId_telegramUserId: { botId: string; telegramUserId: bigint } } }) {
          upsertCalls.push(args);
          return { id: "bot_user_1" };
        }
      }
    } as {
      botUser: {
        upsert: (args: { where: { botId_telegramUserId: { botId: string; telegramUserId: bigint } } }) => Promise<{ id: string }>;
      };
    });

    const receivedAt = new Date("2026-04-06T13:00:00.000Z");

    await repository.recordInteraction({
      botId: "bot_1",
      actor: { id: 999 },
      receivedAt
    });

    await repository.recordInteraction({
      botId: "bot_2",
      actor: { id: 999 },
      receivedAt
    });

    expect(upsertCalls.map((call) => call.where.botId_telegramUserId)).toEqual([
      { botId: "bot_1", telegramUserId: BigInt(999) },
      { botId: "bot_2", telegramUserId: BigInt(999) }
    ]);
  });
});
