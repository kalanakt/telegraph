import { describe, expect, it } from "vitest";
import {
  createBullMqActionQueueAdapter,
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
});
