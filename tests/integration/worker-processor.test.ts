import { describe, expect, it, vi } from "vitest";
import { handleActionJobFailure, processActionJob, type WorkerProcessorDeps } from "../../apps/worker/src/processor";
import { createEmptyWorkflowContext, type ActionJob } from "@telegram-builder/shared";

function makeJob(): ActionJob {
  return {
    runId: "run_1",
    ruleId: "rule_1",
    actionNodeId: "action_1",
    actionRunId: "action_run_1",
    botToken: "token",
    actionType: "telegram.sendMessage",
    executionPolicy: {
      retryClass: "transient",
      timeoutMs: 5000,
      idempotencyKeyStrategy: "event_and_action",
      rateLimitBucket: "telegram.write"
    },
    idempotencyKey: "1:action_run_1:telegram.sendMessage",
    action: { type: "telegram.sendMessage", params: { chat_id: "42", text: "hello" } },
    event: {
      source: "telegram",
      trigger: "message_received",
      eventId: "1",
      updateId: 1,
      chatId: "42",
      chatType: "private",
      messageSource: "user",
      text: "incoming",
      variables: {}
    },
    flowDefinition: {
      nodes: [
        { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "action_1",
          type: "action",
          position: { x: 200, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "42", text: "hello" } }
        }
      ],
      edges: [{ id: "e1", source: "start_1", target: "action_1" }]
    },
    context: {
      trigger: "message_received",
      runtime: createEmptyWorkflowContext({
        variables: {},
        session: {
          id: "session_1",
          botId: "bot_1",
          chatId: "42",
          telegramUserId: "42",
        },
      }),
      createdAt: new Date().toISOString()
    }
  };
}

function createDeps(overrides: Partial<WorkerProcessorDeps> = {}): WorkerProcessorDeps {
  return {
    async updateActionRun() {},
    async countActionRunsByStatus() {
      return 0;
    },
    async updateWorkflowRunStatus() {},
    async getWorkflowRunContext() {
      return createEmptyWorkflowContext();
    },
    async updateWorkflowRunContext() {},
    async syncRuntimeState({ context }) {
      return context;
    },
    async createCheckpoint() {
      return { checkpointId: "checkpoint_1" };
    },
    async getOrCreateActionRun() {
      return { actionRunId: "next_action_run", created: true };
    },
    async enqueueAction() {},
    async enqueueDeadLetter() {},
    async invokeTelegramMethod() {
      return { ok: true };
    },
    ...overrides
  };
}

describe("worker processor", () => {
  it("marks success and finalizes run when send succeeds", async () => {
    const actionRunUpdates: unknown[] = [];
    const runUpdates: unknown[] = [];

    const deps = createDeps({
      async updateActionRun(input) {
        actionRunUpdates.push(input);
      },
      async countActionRunsByStatus(_runId, status) {
        return status === "pending" ? 0 : 0;
      },
      async updateWorkflowRunStatus(runId, status) {
        runUpdates.push({ runId, status });
      }
    });

    await processActionJob(deps, makeJob(), 1);

    expect(actionRunUpdates).toEqual([
      { actionRunId: "action_run_1", status: "pending", attempt: 1 },
      { actionRunId: "action_run_1", status: "succeeded", attempt: 1, lastError: null }
    ]);
    expect(runUpdates).toEqual([{ runId: "run_1", status: "succeeded" }]);
  });

  it("executes telegram.sendInvoice jobs through the Telegram adapter", async () => {
    const invokeTelegramMethod = vi.fn().mockResolvedValue({ ok: true });
    const deps = createDeps({
      invokeTelegramMethod
    });

    await processActionJob(
      deps,
      {
        ...makeJob(),
        actionNodeId: "invoice_1",
        actionRunId: "action_run_invoice_1",
        actionType: "telegram.sendInvoice",
        executionPolicy: {
          retryClass: "transient",
          timeoutMs: 20_000,
          idempotencyKeyStrategy: "event_and_action",
          rateLimitBucket: "telegram.payments"
        },
        idempotencyKey: "1:action_run_invoice_1:telegram.sendInvoice",
        action: {
          type: "telegram.sendInvoice",
          params: {
            chat_id: "42",
            title: "Premium",
            description: "Unlock premium access",
            payload: "premium:stars:monthly:42:1",
            currency: "XTR",
            prices: [{ label: "Premium access", amount: 1200 }]
          }
        },
        flowDefinition: {
          nodes: [
            { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
            {
              id: "invoice_1",
              type: "action",
              position: { x: 200, y: 0 },
              data: {
                type: "telegram.sendInvoice",
                params: {
                  chat_id: "42",
                  title: "Premium",
                  description: "Unlock premium access",
                  payload: "premium:stars:monthly:42:1",
                  currency: "XTR",
                  prices: [{ label: "Premium access", amount: 1200 }]
                }
              }
            }
          ],
          edges: [{ id: "e1", source: "start_1", target: "invoice_1" }]
        }
      },
      1
    );

    expect(invokeTelegramMethod).toHaveBeenCalledWith("token", "sendInvoice", {
      chat_id: "42",
      title: "Premium",
      description: "Unlock premium access",
      payload: "premium:stars:monthly:42:1",
      currency: "XTR",
      prices: [{ label: "Premium access", amount: 1200 }]
    });
  });

  it("keeps bot token when an internal step enqueues a downstream telegram action", async () => {
    const enqueued: ActionJob[] = [];

    const deps = createDeps({
      async countActionRunsByStatus(_runId, status) {
        return status === "pending" ? 1 : 0;
      },
      async enqueueAction(job) {
        enqueued.push(job);
      }
    });

    await processActionJob(
      deps,
      {
        ...makeJob(),
        actionNodeId: "delay_1",
        actionRunId: "action_run_delay",
        actionType: "workflow.delay",
        botToken: "token",
        executionPolicy: {
          retryClass: "permanent",
          timeoutMs: 2000,
          idempotencyKeyStrategy: "action_run",
          rateLimitBucket: "workflow.internal"
        },
        idempotencyKey: "1:action_run_delay:workflow.delay",
        action: { type: "workflow.delay", params: { delay_ms: 1500 } },
        flowDefinition: {
          nodes: [
            { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
            {
              id: "delay_1",
              type: "delay",
              position: { x: 200, y: 0 },
              data: { delay_ms: 1500 }
            },
            {
              id: "action_2",
              type: "action",
              position: { x: 400, y: 0 },
              data: { type: "telegram.sendMessage", params: { chat_id: "42", text: "after delay" } }
            }
          ],
          edges: [
            { id: "e1", source: "start_1", target: "delay_1" },
            { id: "e2", source: "delay_1", target: "action_2" }
          ]
        }
      },
      1
    );

    expect(enqueued).toHaveLength(1);
    expect(enqueued[0]).toMatchObject({
      actionNodeId: "action_2",
      actionType: "telegram.sendMessage",
      botToken: "token"
    });
  });

  it("updates failure + dead-letter on exhausted retries", async () => {
    const actionRunUpdates: unknown[] = [];
    const runUpdates: unknown[] = [];
    const deadLetters: unknown[] = [];

    const deps = createDeps({
      async updateActionRun(input) {
        actionRunUpdates.push(input);
      },
      async updateWorkflowRunStatus(runId, status) {
        runUpdates.push({ runId, status });
      },
      async enqueueDeadLetter(input) {
        deadLetters.push(input);
      }
    });

    await handleActionJobFailure(deps, makeJob(), 5, 5, "boom", "permanent", 400);

    expect(actionRunUpdates).toEqual([
      { actionRunId: "action_run_1", status: "failed", lastError: "boom", attempt: 5 }
    ]);
    expect(runUpdates).toEqual([{ runId: "run_1", status: "failed" }]);
    expect(deadLetters).toHaveLength(1);
  });

  it("creates a checkpoint and marks the run waiting for await-message nodes", async () => {
    const runUpdates: unknown[] = [];
    const checkpoints: unknown[] = [];
    const contextUpdates: unknown[] = [];

    const deps = createDeps({
      async updateWorkflowRunStatus(runId, status) {
        runUpdates.push({ runId, status });
      },
      async createCheckpoint(input) {
        checkpoints.push(input);
        return { checkpointId: "checkpoint_wait_1" };
      },
      async updateWorkflowRunContext(runId, context) {
        contextUpdates.push({ runId, context });
      },
    });

    await processActionJob(
      deps,
      {
        ...makeJob(),
        actionNodeId: "await_1",
        actionRunId: "action_run_wait",
        actionType: "workflow.awaitMessage",
        executionPolicy: {
          retryClass: "permanent",
          timeoutMs: 2000,
          idempotencyKeyStrategy: "action_run",
          rateLimitBucket: "workflow.wait",
        },
        idempotencyKey: "1:action_run_wait:workflow.awaitMessage",
        action: { type: "workflow.awaitMessage", params: { timeout_ms: 60000, store_as: "customer_reply" } },
        flowDefinition: {
          nodes: [
            { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
            { id: "await_1", type: "await_message", position: { x: 200, y: 0 }, data: { timeout_ms: 60000, store_as: "customer_reply" } },
            { id: "action_2", type: "action", position: { x: 400, y: 0 }, data: { type: "telegram.sendMessage", params: { chat_id: "42", text: "after wait" } } },
          ],
          edges: [
            { id: "e1", source: "start_1", target: "await_1" },
            { id: "e2", source: "await_1", target: "action_2" },
          ],
        },
      },
      1
    );

    expect(checkpoints).toHaveLength(1);
    expect(runUpdates).toEqual([{ runId: "run_1", status: "waiting" }]);
    expect(contextUpdates.at(-1)).toMatchObject({
      runId: "run_1",
      context: {
        session: {
          checkpointId: "checkpoint_wait_1",
        },
      },
    });
  });

  it("creates a Crypto Pay invoice and stores payment links in order state", async () => {
    const contextUpdates: unknown[] = [];

    const deps = createDeps({
      async updateWorkflowRunContext(runId, context) {
        contextUpdates.push({ runId, context });
      },
      async invokeCryptoPayMethod() {
        return {
          invoice_id: 77,
          hash: "hash_77",
          currency_type: "crypto",
          status: "active",
          asset: "USDT",
          amount: "25",
          payload: "order_1",
          bot_invoice_url: "https://t.me/CryptoBot?start=invoice-77",
        };
      },
    });

    await processActionJob(
      deps,
      {
        ...makeJob(),
        actionNodeId: "crypto_1",
        actionRunId: "action_run_crypto_1",
        actionType: "cryptopay.createInvoice",
        botToken: null,
        cryptoPayToken: "crypto_token",
        action: {
          type: "cryptopay.createInvoice",
          params: {
            currency_type: "crypto",
            asset: "USDT",
            amount: "25",
            payload: "{{order.id}}",
          },
        },
        flowDefinition: {
          nodes: [
            { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
            {
              id: "crypto_1",
              type: "action",
              position: { x: 200, y: 0 },
              data: {
                type: "cryptopay.createInvoice",
                params: {
                  currency_type: "crypto",
                  asset: "USDT",
                  amount: "25",
                  payload: "{{order.id}}",
                },
              },
            },
          ],
          edges: [{ id: "e1", source: "start_1", target: "crypto_1" }],
        },
        context: {
          ...makeJob().context,
          runtime: createEmptyWorkflowContext({
            session: {
              id: "session_1",
            },
            order: {
              id: "order_1",
            },
          }),
        },
      },
      1
    );

    expect(contextUpdates.at(-1)).toMatchObject({
      runId: "run_1",
      context: {
        order: {
          invoicePayload: "order_1",
          status: "awaiting_payment",
          attributes: {
            cryptoPayInvoiceHash: "hash_77",
            cryptoPayInvoiceUrl: "https://t.me/CryptoBot?start=invoice-77",
          },
        },
      },
    });
  });
});
