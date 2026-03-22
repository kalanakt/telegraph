import { defineStore } from "pinia";

export type BotNodeKind = "trigger" | "message" | "condition" | "ai" | "action";

export interface BotNodeData {
  kind: BotNodeKind;
  title: string;
  subtitle: string;
  chips: string[];
  metric: string;
}

export interface BotFlowNode {
  id: string;
  type: "teleNode";
  position: { x: number; y: number };
  data: BotNodeData;
}

export interface BotFlowEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated: boolean;
  markerEnd: {
    type: string;
    color: string;
  };
  style: {
    stroke: string;
    opacity: number;
    strokeWidth: number;
  };
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkspaceAccount {
  id: string;
  name: string;
  owner: string;
  status: "active" | "paused";
  createdAt: string;
}

export interface TelegramBot {
  id: string;
  accountId: string;
  name: string;
  username: string;
  telegramToken: string;
  webhookSecret: string;
  description: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  lastPublishedAt?: string;
  triggerCount: number;
  actionCount: number;
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
}

interface CreateBotInput {
  accountId: string;
  name: string;
  username: string;
  telegramToken: string;
  webhookSecret: string;
  description: string;
}

interface CreateAccountInput {
  name: string;
  owner: string;
}

interface BotsState {
  hydrated: boolean;
  accounts: WorkspaceAccount[];
  bots: TelegramBot[];
}

const BOTS_STORAGE_KEY = "telegraph-bots-v1";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function createDefaultFlow(): {
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
  triggerCount: number;
  actionCount: number;
} {
  const nodes: BotFlowNode[] = [
    {
      id: "trigger-start",
      type: "teleNode",
      position: { x: 50, y: 230 },
      data: {
        kind: "trigger",
        title: "/start",
        subtitle: "Entry trigger for first user interaction.",
        chips: ["command", "entry"],
        metric: "0 runs",
      },
    },
    {
      id: "message-welcome",
      type: "teleNode",
      position: { x: 360, y: 170 },
      data: {
        kind: "message",
        title: "Welcome Message",
        subtitle: "Send greeting and menu choices.",
        chips: ["reply", "menu"],
        metric: "0 runs",
      },
    },
    {
      id: "condition-route",
      type: "teleNode",
      position: { x: 700, y: 170 },
      data: {
        kind: "condition",
        title: "Route by Intent",
        subtitle: "Split path by user response.",
        chips: ["branch", "intent"],
        metric: "0 runs",
      },
    },
    {
      id: "action-notify",
      type: "teleNode",
      position: { x: 1010, y: 280 },
      data: {
        kind: "action",
        title: "Notify Team",
        subtitle: "Send webhook to external service.",
        chips: ["webhook", "team"],
        metric: "0 runs",
      },
    },
  ];

  const edges: BotFlowEdge[] = [
    {
      id: "edge-1",
      source: "trigger-start",
      target: "message-welcome",
      type: "smoothstep",
      animated: true,
      markerEnd: { type: "ArrowClosed", color: "#334155" },
      style: { stroke: "#334155", opacity: 0.65, strokeWidth: 1.4 },
    },
    {
      id: "edge-2",
      source: "message-welcome",
      target: "condition-route",
      type: "smoothstep",
      animated: true,
      markerEnd: { type: "ArrowClosed", color: "#334155" },
      style: { stroke: "#334155", opacity: 0.65, strokeWidth: 1.4 },
    },
    {
      id: "edge-3",
      source: "condition-route",
      target: "action-notify",
      type: "smoothstep",
      animated: true,
      markerEnd: { type: "ArrowClosed", color: "#334155" },
      style: { stroke: "#334155", opacity: 0.65, strokeWidth: 1.4 },
    },
  ];

  return {
    nodes,
    edges,
    triggerCount: nodes.filter((node) => node.data.kind === "trigger").length,
    actionCount: nodes.filter((node) => node.data.kind === "action").length,
  };
}

function defaultAccounts(): WorkspaceAccount[] {
  return [
    {
      id: "account-main",
      name: "Main Workspace",
      owner: "Workspace Owner",
      status: "active",
      createdAt: isoNow(),
    },
    {
      id: "account-team",
      name: "Team Workspace",
      owner: "Bot Team",
      status: "active",
      createdAt: isoNow(),
    },
  ];
}

function defaultBots(): TelegramBot[] {
  const starterFlow = createDefaultFlow();
  return [
    {
      id: "bot-starter",
      accountId: "account-main",
      name: "Starter Support Bot",
      username: "@starter_support_bot",
      telegramToken: "000000:sample-token",
      webhookSecret: "sample-webhook-secret",
      description: "Starter template for support and lead routing.",
      status: "draft",
      createdAt: isoNow(),
      updatedAt: isoNow(),
      triggerCount: starterFlow.triggerCount,
      actionCount: starterFlow.actionCount,
      nodes: starterFlow.nodes,
      edges: starterFlow.edges,
    },
  ];
}

function cloneNodes(nodes: BotFlowNode[]): BotFlowNode[] {
  return nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: {
      ...node.data,
      chips: [...node.data.chips],
    },
  }));
}

function cloneEdges(edges: BotFlowEdge[]): BotFlowEdge[] {
  return edges.map((edge) => ({
    ...edge,
    markerEnd: { ...edge.markerEnd },
    style: { ...edge.style },
  }));
}

export const useBotsStore = defineStore("bots", {
  state: (): BotsState => ({
    hydrated: false,
    accounts: defaultAccounts(),
    bots: defaultBots(),
  }),

  getters: {
    publishedBots: (state) =>
      state.bots.filter((bot) => bot.status === "published").length,
    draftBots: (state) =>
      state.bots.filter((bot) => bot.status === "draft").length,
  },

  actions: {
    hydrate() {
      if (this.hydrated) return;
      this.hydrated = true;

      const raw = localStorage.getItem(BOTS_STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as Pick<BotsState, "accounts" | "bots">;
        if (Array.isArray(parsed.accounts) && Array.isArray(parsed.bots)) {
          this.accounts = parsed.accounts;
          this.bots = parsed.bots;
        }
      } catch {
        localStorage.removeItem(BOTS_STORAGE_KEY);
      }
    },

    persist() {
      localStorage.setItem(
        BOTS_STORAGE_KEY,
        JSON.stringify({
          accounts: this.accounts,
          bots: this.bots,
        }),
      );
    },

    getBotById(botId: string): TelegramBot | undefined {
      return this.bots.find((bot) => bot.id === botId);
    },

    createBot(input: CreateBotInput): TelegramBot {
      const starterFlow = createDefaultFlow();
      const now = isoNow();
      const bot: TelegramBot = {
        id: createId("bot"),
        accountId: input.accountId,
        name: input.name.trim(),
        username: input.username.trim(),
        telegramToken: input.telegramToken.trim(),
        webhookSecret: input.webhookSecret.trim(),
        description: input.description.trim(),
        status: "draft",
        createdAt: now,
        updatedAt: now,
        triggerCount: starterFlow.triggerCount,
        actionCount: starterFlow.actionCount,
        nodes: starterFlow.nodes,
        edges: starterFlow.edges,
      };

      this.bots = [bot, ...this.bots];
      this.persist();
      return bot;
    },

    updateBot(botId: string, patch: Partial<TelegramBot>) {
      const bot = this.getBotById(botId);
      if (!bot) return;

      Object.assign(bot, patch, { updatedAt: isoNow() });
      this.persist();
    },

    saveFlow(botId: string, nodes: BotFlowNode[], edges: BotFlowEdge[]) {
      const bot = this.getBotById(botId);
      if (!bot) return;

      bot.nodes = cloneNodes(nodes);
      bot.edges = cloneEdges(edges);
      bot.triggerCount = bot.nodes.filter(
        (node) => node.data.kind === "trigger",
      ).length;
      bot.actionCount = bot.nodes.filter(
        (node) => node.data.kind === "action",
      ).length;
      bot.updatedAt = isoNow();
      this.persist();
    },

    publishBot(botId: string) {
      const bot = this.getBotById(botId);
      if (!bot) return;

      bot.status = "published";
      bot.lastPublishedAt = isoNow();
      bot.updatedAt = isoNow();
      this.persist();
    },

    unpublishBot(botId: string) {
      const bot = this.getBotById(botId);
      if (!bot) return;

      bot.status = "draft";
      bot.updatedAt = isoNow();
      this.persist();
    },

    createAccount(input: CreateAccountInput): WorkspaceAccount {
      const account: WorkspaceAccount = {
        id: createId("account"),
        name: input.name.trim(),
        owner: input.owner.trim(),
        status: "active",
        createdAt: isoNow(),
      };

      this.accounts = [account, ...this.accounts];
      this.persist();
      return account;
    },

    toggleAccountStatus(accountId: string) {
      const account = this.accounts.find((item) => item.id === accountId);
      if (!account) return;

      account.status = account.status === "active" ? "paused" : "active";
      this.persist();
    },
  },
});
