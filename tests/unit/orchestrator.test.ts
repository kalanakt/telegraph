import { describe, expect, it } from "vitest";
import {
  createAutomationOrchestrator,
  type ActionJob,
  type BotRepository,
  type BotUserRepository,
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

function flowThatDelaysThenReplies() {
  return {
    nodes: [
      { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
      {
        id: "delay_1",
        type: "delay",
        position: { x: 200, y: 0 },
        data: { delay_ms: 1500 }
      },
      {
        id: "action_1",
        type: "action",
        position: { x: 400, y: 0 },
        data: { type: "telegram.sendMessage", params: { chat_id: "333", text: "After delay" } }
      }
    ],
    edges: [
      { id: "e1", source: "start_1", target: "delay_1" },
      { id: "e2", source: "delay_1", target: "action_1" }
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

function makeCallbackUpdate(data = "booking:summary:edit") {
  return {
    update_id: 11,
    callback_query: {
      id: "callback_1",
      from: { id: 444, username: "booker" },
      data,
      message: {
        message_id: 91,
        chat: { id: 333, type: "private" },
        text: "Confirm or edit"
      }
    }
  };
}

function makeActiveBotContext(captureUsersEnabled = false) {
  return {
    botId: "bot_1",
    userId: "user_1",
    encryptedToken: "enc",
    status: "active",
    plan: "FREE" as const,
    captureUsersEnabled
  };
}

function createNoopBotUserRepository(): BotUserRepository {
  return {
    async recordInteraction() {}
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
      botUserRepository: createNoopBotUserRepository(),
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
          return makeActiveBotContext();
        }
      },
      botUserRepository: createNoopBotUserRepository(),
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
          return makeActiveBotContext();
        }
      },
      botUserRepository: createNoopBotUserRepository(),
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
          return makeActiveBotContext();
        }
      },
      botUserRepository: createNoopBotUserRepository(),
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
          return makeActiveBotContext();
        }
      },
      botUserRepository: createNoopBotUserRepository(),
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
              botId: "bot_1",
              trigger: "message_received",
              flowDefinition: flowThatRepliesIfContainsHello()
            },
            {
              ruleId: "rule_no_match",
              botId: "bot_1",
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

  it("preserves bot token on internal steps when downstream telegram actions exist", async () => {
    const enqueued: ActionJob[] = [];

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return makeActiveBotContext();
        }
      },
      botUserRepository: createNoopBotUserRepository(),
      eventRepository: {
        async createIncomingEvent() {
          return { status: "created", eventId: "evt_1" };
        }
      },
      ruleRepository: {
        async listActiveRules() {
          return [
            {
              ruleId: "rule_delay",
              botId: "bot_1",
              trigger: "message_received",
              flowDefinition: flowThatDelaysThenReplies()
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
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].actionType).toBe("workflow.delay");
    expect(enqueued[0].botToken).toBe("decrypted-token");
  });

  it("records bot users when capture is enabled and an actor exists", async () => {
    const captured: Array<{ botId: string; actorId: number }> = [];

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return makeActiveBotContext(true);
        }
      },
      botUserRepository: {
        async recordInteraction(input) {
          captured.push({ botId: input.botId, actorId: input.actor.id });
        }
      },
      eventRepository: {
        async createIncomingEvent() {
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
          return { runId: "run_1", actionRuns: [] };
        }
      },
      actionQueue: {
        async enqueueAction() {}
      },
      entitlementPolicy: {
        async isMonthlyExecutionExceeded() {
          return false;
        }
      },
      decryptToken: () => "decrypted"
    });

    await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: makeUpdate(),
      receivedAt: new Date()
    });

    expect(captured).toEqual([{ botId: "bot_1", actorId: 444 }]);
  });

  it("skips bot-user capture when the setting is off", async () => {
    let captureCalls = 0;

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return makeActiveBotContext(false);
        }
      },
      botUserRepository: {
        async recordInteraction() {
          captureCalls += 1;
        }
      },
      eventRepository: {
        async createIncomingEvent() {
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
          return { runId: "run_1", actionRuns: [] };
        }
      },
      actionQueue: {
        async enqueueAction() {}
      },
      entitlementPolicy: {
        async isMonthlyExecutionExceeded() {
          return false;
        }
      },
      decryptToken: () => "decrypted"
    });

    await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: makeUpdate(),
      receivedAt: new Date()
    });

    expect(captureCalls).toBe(0);
  });

  it("skips bot-user capture when the update has no actor", async () => {
    let captureCalls = 0;

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return makeActiveBotContext(true);
        }
      },
      botUserRepository: {
        async recordInteraction() {
          captureCalls += 1;
        }
      },
      eventRepository: {
        async createIncomingEvent() {
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
          return { runId: "run_1", actionRuns: [] };
        }
      },
      actionQueue: {
        async enqueueAction() {}
      },
      entitlementPolicy: {
        async isMonthlyExecutionExceeded() {
          return false;
        }
      },
      decryptToken: () => "decrypted"
    });

    await orchestrator.handleIncomingUpdate({
      botId: "bot_1",
      telegramUpdate: { update_id: 100, channel_post: { message_id: 1, chat: { id: 2, type: "channel" }, text: "hello" } },
      receivedAt: new Date()
    });

    expect(captureCalls).toBe(0);
  });

  it("does not fail orchestration when bot-user capture throws", async () => {
    const enqueued: ActionJob[] = [];

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return makeActiveBotContext(true);
        }
      },
      botUserRepository: {
        async recordInteraction() {
          throw new Error("db unavailable");
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
              botId: "bot_1",
              trigger: "message_received",
              flowDefinition: flowThatRepliesIfContainsHello()
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
    expect(enqueued).toHaveLength(1);
  });

  it("resumes from an open checkpoint before starting fresh flows", async () => {
    const enqueued: ActionJob[] = [];
    const resolvedCheckpoints: string[] = [];
    const createdRuns: unknown[] = [];

    const flow = {
      nodes: [
        { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
        { id: "await_1", type: "await_message", position: { x: 200, y: 0 }, data: { timeout_ms: 60000, store_as: "customer_reply" } },
        {
          id: "action_1",
          type: "action",
          position: { x: 400, y: 0 },
          data: { type: "telegram.sendMessage", params: { chat_id: "333", text: "thanks {{vars.customer_reply}}" } }
        }
      ],
      edges: [
        { id: "e1", source: "start_1", target: "await_1" },
        { id: "e2", source: "await_1", target: "action_1" }
      ]
    };

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return makeActiveBotContext();
        }
      },
      botUserRepository: createNoopBotUserRepository(),
      eventRepository: {
        async createIncomingEvent() {
          return { status: "created", eventId: "evt_resume" };
        }
      },
      ruleRepository: {
        async listActiveRules() {
          return [];
        },
        async findActiveRuleById() {
          return {
            ruleId: "rule_wait",
            botId: "bot_1",
            trigger: "message_received",
            flowDefinition: flow
          };
        }
      },
      runRepository: {
        async createRunWithActions(input) {
          createdRuns.push(input);
          return {
            runId: "run_resumed",
            actionRuns: input.actions.map((action) => ({
              actionId: action.actionId,
              actionRunId: `action_run_${action.actionId}`,
              action: action.payload
            }))
          };
        }
      },
      runtimeRepository: {
        async prepareContextForEvent() {
          return {
            sessionId: "session_1",
            context: {
              variables: {},
              session: { id: "session_1", botId: "bot_1", chatId: "333", telegramUserId: "444" },
              customer: {},
              order: {}
            }
          };
        },
        async findMatchingCheckpoint() {
          return {
            checkpointId: "checkpoint_1",
            ruleId: "rule_wait",
            nodeId: "await_1",
            checkpointType: "workflow.awaitMessage",
            status: "OPEN",
            sessionId: "session_1",
            flowDefinition: flow,
            botId: "bot_1",
            metadata: { store_as: "customer_reply" }
          };
        },
        async resolveCheckpoint(input) {
          resolvedCheckpoints.push(input.checkpointId);
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
      telegramUpdate: makeUpdate("hello after wait"),
      receivedAt: new Date()
    });

    expect(result.runIds).toEqual(["run_resumed"]);
    expect(resolvedCheckpoints).toEqual(["checkpoint_1"]);
    expect(createdRuns).toHaveLength(1);
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0]?.actionNodeId).toBe("action_1");
    expect(enqueued[0]?.context.runtime.variables.customer_reply).toBe("hello after wait");
  });

  it("resumes callback waits and routes edit choices through a switch branch", async () => {
    const enqueued: ActionJob[] = [];
    const resolvedCheckpoints: string[] = [];

    const flow = {
      nodes: [
        { id: "start_1", type: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "await_summary",
          type: "await_callback",
          position: { x: 220, y: 0 },
          data: {
            timeout_ms: 60000,
            callback_prefix: "booking:summary:",
            store_as: "booking.summary_action"
          }
        },
        {
          id: "summary_switch",
          type: "switch",
          position: { x: 440, y: 0 },
          data: {
            path: "vars.booking.summary_action",
            cases: [
              { id: "confirm", value: "booking:summary:confirm", label: "Confirm" },
              { id: "edit", value: "booking:summary:edit", label: "Edit" }
            ]
          }
        },
        {
          id: "notify_admin",
          type: "action",
          position: { x: 680, y: -120 },
          data: {
            type: "telegram.sendMessage",
            params: { chat_id: "-100admin", text: "New booking" }
          }
        },
        {
          id: "ask_service",
          type: "action",
          position: { x: 680, y: 120 },
          data: {
            type: "telegram.sendMessage",
            params: { chat_id: "333", text: "What service do you want to book?" }
          }
        }
      ],
      edges: [
        { id: "e1", source: "start_1", target: "await_summary" },
        { id: "e2", source: "await_summary", target: "summary_switch" },
        { id: "e3", source: "summary_switch", target: "notify_admin", sourceHandle: "confirm" },
        { id: "e4", source: "summary_switch", target: "ask_service", sourceHandle: "edit" }
      ]
    };

    const orchestrator = createAutomationOrchestrator({
      botRepository: {
        async findBotContext() {
          return makeActiveBotContext();
        }
      },
      botUserRepository: createNoopBotUserRepository(),
      eventRepository: {
        async createIncomingEvent() {
          return { status: "created", eventId: "evt_callback_resume" };
        }
      },
      ruleRepository: {
        async listActiveRules() {
          return [];
        },
        async findActiveRuleById() {
          return {
            ruleId: "rule_booking",
            botId: "bot_1",
            trigger: "command_received",
            flowDefinition: flow
          };
        }
      },
      runRepository: {
        async createRunWithActions(input) {
          return {
            runId: "run_callback_resume",
            actionRuns: input.actions.map((action) => ({
              actionId: action.actionId,
              actionRunId: `action_run_${action.actionId}`,
              action: action.payload
            }))
          };
        }
      },
      runtimeRepository: {
        async prepareContextForEvent() {
          return {
            sessionId: "session_1",
            context: {
              variables: {},
              session: { id: "session_1", botId: "bot_1", chatId: "333", telegramUserId: "444" },
              customer: {},
              order: {}
            }
          };
        },
        async findMatchingCheckpoint() {
          return {
            checkpointId: "checkpoint_summary",
            ruleId: "rule_booking",
            nodeId: "await_summary",
            checkpointType: "workflow.awaitCallback",
            status: "OPEN",
            sessionId: "session_1",
            flowDefinition: flow,
            botId: "bot_1",
            metadata: {
              store_as: "booking.summary_action",
              callback_prefix: "booking:summary:"
            }
          };
        },
        async resolveCheckpoint(input) {
          resolvedCheckpoints.push(input.checkpointId);
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
      telegramUpdate: makeCallbackUpdate(),
      receivedAt: new Date()
    });

    expect(result.runIds).toEqual(["run_callback_resume"]);
    expect(resolvedCheckpoints).toEqual(["checkpoint_summary"]);
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0]?.actionNodeId).toBe("ask_service");
    expect(enqueued[0]?.context.runtime.variables.booking).toMatchObject({
      summary_action: "booking:summary:edit"
    });
  });
});
