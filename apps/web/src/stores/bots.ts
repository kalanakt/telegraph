import { apiRequest } from "@/lib/api";
import { defineStore } from "pinia";

export interface TelegramBot {
  id: string;
  name: string;
  username: string | null;
  status: "active" | "paused" | "deleted";
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowRecord {
  id: string;
  botId: string;
  tenantId: string;
  name: string;
  description: string | null;
  graphJson: unknown;
  isPublished: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface PublishPlanRecord {
  id: string;
  flowId: string;
  botId: string;
  tenantId: string;
  version: number;
  publishedAt: string;
}

interface BotsState {
  bots: TelegramBot[];
  loaded: boolean;
  loading: boolean;
}

interface CreateBotInput {
  name: string;
  token: string;
}

interface UpdateBotInput {
  name?: string;
}

function upsertBot(list: TelegramBot[], bot: TelegramBot): TelegramBot[] {
  const existingIndex = list.findIndex((item) => item.id === bot.id);
  if (existingIndex === -1) {
    return [bot, ...list];
  }

  const next = [...list];
  next[existingIndex] = bot;
  return next;
}

export const useBotsStore = defineStore("bots", {
  state: (): BotsState => ({
    bots: [],
    loaded: false,
    loading: false,
  }),

  getters: {
    activeBots: (state) => state.bots.filter((bot) => bot.status === "active"),
  },

  actions: {
    getBotById(botId: string): TelegramBot | undefined {
      return this.bots.find((bot) => bot.id === botId);
    },

    async fetchBots(token: string) {
      this.loading = true;
      try {
        const bots = await apiRequest<TelegramBot[]>("/api/bots", {
          token,
        });
        this.bots = bots;
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },

    async ensureBotsLoaded(token: string) {
      if (this.loaded) return;
      await this.fetchBots(token);
    },

    async createBot(
      token: string,
      input: CreateBotInput,
    ): Promise<TelegramBot> {
      const bot = await apiRequest<TelegramBot>("/api/bots", {
        method: "POST",
        token,
        body: {
          name: input.name.trim(),
          token: input.token.trim(),
        },
      });

      this.bots = upsertBot(this.bots, bot);
      return bot;
    },

    async updateBot(
      token: string,
      botId: string,
      patch: UpdateBotInput,
    ): Promise<TelegramBot> {
      const bot = await apiRequest<TelegramBot>(`/api/bots/${botId}`, {
        method: "PATCH",
        token,
        body: patch,
      });

      this.bots = upsertBot(this.bots, bot);
      return bot;
    },

    async registerWebhook(
      token: string,
      botId: string,
      webhookBaseUrl: string,
    ): Promise<{ webhookUrl: string }> {
      return apiRequest<{ webhookUrl: string }>(
        `/api/bots/${botId}/webhook/register`,
        {
          method: "POST",
          token,
          body: { webhookBaseUrl },
        },
      );
    },

    async removeWebhook(token: string, botId: string): Promise<void> {
      await apiRequest<void>(`/api/bots/${botId}/webhook/remove`, {
        method: "POST",
        token,
      });
    },

    async listFlows(token: string, botId: string): Promise<FlowRecord[]> {
      return apiRequest<FlowRecord[]>(`/api/bots/${botId}/flows`, {
        token,
      });
    },

    async createFlow(
      token: string,
      botId: string,
      name: string,
    ): Promise<FlowRecord> {
      return apiRequest<FlowRecord>(`/api/bots/${botId}/flows`, {
        method: "POST",
        token,
        body: { name },
      });
    },

    async getFlow(
      token: string,
      botId: string,
      flowId: string,
    ): Promise<FlowRecord> {
      return apiRequest<FlowRecord>(`/api/bots/${botId}/flows/${flowId}`, {
        token,
      });
    },

    async getOrCreateMainFlow(
      token: string,
      botId: string,
    ): Promise<FlowRecord> {
      const flows = await this.listFlows(token, botId);
      const main = flows.find((flow) => flow.name.toLowerCase() === "main");
      if (main) return main;

      if (flows[0]) return flows[0];

      return this.createFlow(token, botId, "Main");
    },

    async saveFlowGraph(
      token: string,
      botId: string,
      flowId: string,
      graphJson: unknown,
    ): Promise<FlowRecord> {
      return apiRequest<FlowRecord>(`/api/bots/${botId}/flows/${flowId}`, {
        method: "PUT",
        token,
        body: { graphJson },
      });
    },

    async publishFlow(
      token: string,
      botId: string,
      flowId: string,
    ): Promise<PublishPlanRecord> {
      return apiRequest<PublishPlanRecord>(
        `/api/bots/${botId}/flows/${flowId}/publish`,
        {
          method: "POST",
          token,
        },
      );
    },
  },
});
