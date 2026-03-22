import { apiRequest } from "@/lib/api";
import { defineStore } from "pinia";
import type { FlowGraph } from "@telegraph/schemas";

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
  graph?: FlowGraph | null;
  isPublished: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  graphJson?: unknown;
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
  webhookBaseUrl?: string;
}

interface UpdateBotInput {
  name?: string;
}

export interface CreateBotResponse extends TelegramBot {
  webhookUrl?: string;
  webhookError?: string;
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
    ): Promise<CreateBotResponse> {
      const bot = await apiRequest<CreateBotResponse>("/api/bots", {
        method: "POST",
        token,
        body: {
          name: input.name.trim(),
          token: input.token.trim(),
          ...(input.webhookBaseUrl != null && {
            webhookBaseUrl: input.webhookBaseUrl.trim(),
          }),
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

    async sendTestMessage(
      token: string,
      botId: string,
      input: { chatId: string; text: string },
    ): Promise<{ ok: boolean; messageId: number }> {
      return apiRequest<{ ok: boolean; messageId: number }>(
        `/api/bots/${botId}/test-message`,
        {
          method: "POST",
          token,
          body: {
            chatId: input.chatId.trim(),
            text: input.text,
          },
        },
      );
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
      if (main) return this.getFlow(token, botId, main.id);

      if (flows[0]) return this.getFlow(token, botId, flows[0].id);

      const created = await this.createFlow(token, botId, "Main");
      return this.getFlow(token, botId, created.id);
    },

    async saveFlowGraph(
      token: string,
      botId: string,
      flowId: string,
      graph: FlowGraph,
    ): Promise<FlowRecord> {
      return apiRequest<FlowRecord>(`/api/bots/${botId}/flows/${flowId}`, {
        method: "PUT",
        token,
        body: { graph },
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
