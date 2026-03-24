import { describe, expect, it } from "vitest";
import { handleActionJobFailure, processActionJob, type WorkerProcessorDeps } from "../../apps/worker/src/processor";
import type { ActionJob } from "@telegram-builder/shared";

function makeJob(): ActionJob {
  return {
    runId: "run_1",
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
      trigger: "message_received",
      updateId: 1,
      chatId: "42",
      chatType: "private",
      messageSource: "user",
      text: "incoming",
      variables: {}
    },
    context: {
      trigger: "message_received",
      variables: {},
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
});
