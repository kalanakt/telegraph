import { describe, expect, it } from "vitest";
import {
  createAutomationOrchestrator,
  type ActionJob,
  type BotRepository,
  type EntitlementPolicy,
  type EventRepository,
  type RuleRepository,
  type RunRepository
} from "@telegram-builder/shared";

function flowThatRepliesIfContainsHello() {
  return {
    nodes: [
      { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
      {
        id: "condition_1",
        type: "condition",
        position: { x: 200, y: 0 },
        data: { type: "text_contains", value: "hello" }
      },
      {
        id: "action_1",
        type: "action",
        position: { x: 400, y: 0 },
        data: { type: "telegram.sendMessage", params: { chat_id: "333", text: "Hi!" } }
      }
    ],
    edges: [
      { id: "e1", source: "start_1", target: "condition_1" },
      { id: "e2", source: "condition_1", target: "action_1", sourceHandle: "true" }
    ]
  };
}

function flowThatRepliesIfEqualsBye() {
  return {
    nodes: [
      { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
      {
        id: "condition_1",
        type: "condition",
        position: { x: 200, y: 0 },
        data: { type: "text_equals", value: "bye" }
      },
      {
        id: "action_1",
        type: "action",
        position: { x: 400, y: 0 },
        data: { type: "telegram.sendMessage", params: { chat_id: "333", text: "Ignored" } }
      }
    ],
    edges: [
      { id: "e1", source: "start_1", target: "condition_1" },
      { id: "e2", source: "condition_1", target: "action_1", sourceHandle: "true" }
    ]
  };
}

function makeUpdate(text = "hello") {
  return {
    update_id: 10,
    message: {
      message_id: 90,
      chat: { id: 333, type: "private" },
      from: { id: 444 },
      text
    }
  };
}

describe("AutomationOrchestrator", () => {
  it("returns inactive_bot without side effects", async () => {
    const enqueued: ActionJob[] = [];

    const botRepository: BotRepository = {
      async findBotContext() {
        return null;
      }
    };

    const eventRepository: EventRepository = {
      async createIncomingEvent() {
        throw new Error("should not be called");
      }
    };

    const ruleRepository: RuleRepository = {
      async listActiveRules() {
        throw new Error("should not be called");
      }
    };

    const runRepository: RunRepository = {
      async createRunWithActions() {
        throw new Error("should not be called");
      }
    };

    const entitlementPolicy: EntitlementPolicy = {
      async isMonthlyExecutionExceeded() {
        throw new Error("should not be called");
      }
    };

    const orchestrator = createAutomationOrchestrator({
      botRepository,
      eventRepository,
      ruleRepository,
      runRepository,
      actionQueue: {
        async enqueueAction(job) {
          enqueued.push(job);
        }
      },
      entitlementPolicy,
      decryptToken: () => "decrypted"
    });

    const result = await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: makeUpdate(),
      receivedAt: new Date()
    });

    expect(result.reason).toBe("inactive_bot");
    expect(result.queuedActions).toBe(0);
    expect(enqueued).toHaveLength(0);
  });

  it("returns duplicate_update and does not enqueue", async () => {
    const enqueued: ActionJob[] = [];

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return {
            botId: "bot_1",
            userId: "user_1",
            encryptedToken: "enc",
            status: "active",
            plan: "FREE"
          };
        }
      },
      eventRepository: {
        async createIncomingEvent() {
          return { status: "duplicate" };
        }
      },
      ruleRepository: {
        async listActiveRules() {
          return [];
        }
      },
      runRepository: {
        async createRunWithActions() {
          return { runId: "", actionRuns: [] };
        }
      },
      actionQueue: {
        async enqueueAction(job) {
          enqueued.push(job);
        }
      },
      entitlementPolicy: {
        async isMonthlyExecutionExceeded() {
          return false;
        }
      },
      decryptToken: () => "decrypted"
    });

    const result = await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: makeUpdate(),
      receivedAt: new Date()
    });

    expect(result.reason).toBe("duplicate_update");
    expect(enqueued).toHaveLength(0);
  });

  it("maps unknown updates to catch-all trigger and can still process", async () => {
    const enqueued: ActionJob[] = [];
    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return {
            botId: "bot_1",
            userId: "user_1",
            encryptedToken: "enc",
            status: "active",
            plan: "FREE"
          };
        }
      },
      eventRepository: {
        async createIncomingEvent() {
          return { status: "created", eventId: "evt_1" };
        }
      },
      ruleRepository: { async listActiveRules() { return []; } },
      runRepository: { async createRunWithActions() { return { runId: "", actionRuns: [] }; } },
      actionQueue: { async enqueueAction(job) { enqueued.push(job); } },
      entitlementPolicy: { async isMonthlyExecutionExceeded() { return false; } },
      decryptToken: () => ""
    });

    const result = await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: { update_id: 1 },
      receivedAt: new Date()
    });

    expect(result.reason).toBe("processed");
    expect(result.queuedActions).toBe(0);
    expect(enqueued).toHaveLength(0);
  });

  it("returns plan_execution_limit after event persistence", async () => {
    let eventsCreated = 0;
    let runsCreated = 0;

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return {
            botId: "bot_1",
            userId: "user_1",
            encryptedToken: "enc",
            status: "active",
            plan: "FREE"
          };
        }
      },
      eventRepository: {
        async createIncomingEvent() {
          eventsCreated += 1;
          return { status: "created", eventId: "evt_1" };
        }
      },
      ruleRepository: {
        async listActiveRules() {
          return [];
        }
      },
      runRepository: {
        async createRunWithActions() {
          runsCreated += 1;
          return { runId: "run_1", actionRuns: [] };
        }
      },
      actionQueue: {
        async enqueueAction() {}
      },
      entitlementPolicy: {
        async isMonthlyExecutionExceeded() {
          return true;
        }
      },
      decryptToken: () => "decrypted"
    });

    const result = await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: makeUpdate(),
      receivedAt: new Date()
    });

    expect(result.reason).toBe("plan_execution_limit");
    expect(eventsCreated).toBe(1);
    expect(runsCreated).toBe(0);
  });

  it("creates runs and enqueues actions for matched rules only", async () => {
    const enqueued: ActionJob[] = [];

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return {
            botId: "bot_1",
            userId: "user_1",
            encryptedToken: "enc",
            status: "active",
            plan: "FREE"
          };
        }
      },
      eventRepository: {
        async createIncomingEvent() {
          return { status: "created", eventId: "evt_1" };
        }
      },
      ruleRepository: {
        async listActiveRules() {
          return [
            {
              ruleId: "rule_match",
              trigger: "message_received",
              flowDefinition: flowThatRepliesIfContainsHello()
            },
            {
              ruleId: "rule_no_match",
              trigger: "message_received",
              flowDefinition: flowThatRepliesIfEqualsBye()
            }
          ];
        }
      },
      runRepository: {
        async createRunWithActions(input) {
          return {
            runId: `run_for_${input.rule.ruleId}`,
            actionRuns: input.actions.map((action) => ({
              actionRunId: `action_run_${action.actionId}`,
              action: action.payload
            }))
          };
        }
      },
      actionQueue: {
        async enqueueAction(job) {
          enqueued.push(job);
        }
      },
      entitlementPolicy: {
        async isMonthlyExecutionExceeded() {
          return false;
        }
      },
      decryptToken: () => "decrypted-token"
    });

    const result = await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: makeUpdate("hello there"),
      receivedAt: new Date()
    });

    expect(result.reason).toBe("processed");
    expect(result.runIds).toEqual(["run_for_rule_match"]);
    expect(result.queuedActions).toBe(1);
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].botToken).toBe("decrypted-token");
  });
});
