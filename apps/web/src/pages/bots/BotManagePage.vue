<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBotsStore } from "@/stores/bots";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const botsStore = useBotsStore();
const route = useRoute();
const router = useRouter();

const botId = computed(() => String(route.params["botId"] ?? ""));
const bot = computed(() => botsStore.getBotById(botId.value));

const form = ref({
  name: "",
  username: "",
  telegramToken: "",
  webhookSecret: "",
  description: "",
});

const message = ref("");

watch(
  bot,
  (value) => {
    if (!value) return;
    form.value = {
      name: value.name,
      username: value.username,
      telegramToken: value.telegramToken,
      webhookSecret: value.webhookSecret,
      description: value.description,
    };
  },
  { immediate: true },
);

function save() {
  if (!bot.value) return;

  botsStore.updateBot(bot.value.id, {
    name: form.value.name.trim(),
    username: form.value.username.trim(),
    telegramToken: form.value.telegramToken.trim(),
    webhookSecret: form.value.webhookSecret.trim(),
    description: form.value.description.trim(),
  });
  message.value = "Bot settings saved.";
}

function publishToggle() {
  if (!bot.value) return;
  if (bot.value.status === "published") {
    botsStore.unpublishBot(bot.value.id);
    message.value = "Bot moved to draft.";
    return;
  }

  botsStore.publishBot(bot.value.id);
  message.value = "Bot published.";
}

function maskToken(token: string): string {
  if (token.length < 8) return "********";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
</script>

<template>
  <AppShell
    title="Manage Bot"
    subtitle="Update credentials, status, and publishing settings."
  >
    <div v-if="!bot" class="rounded-xl border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-700">Bot not found.</p>
      <RouterLink to="/bots">
        <Button
          variant="outline"
          class="mt-3 border-slate-200 bg-white shadow-none"
        >
          Back to Bots
        </Button>
      </RouterLink>
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="flex items-center gap-2">
          <p class="text-sm font-semibold text-slate-900">{{ bot.name }}</p>
          <Badge
            :class="
              bot.status === 'published'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border border-amber-200 bg-amber-50 text-amber-700'
            "
          >
            {{ bot.status }}
          </Badge>
        </div>
        <p class="mt-1 text-xs text-slate-500">{{ bot.username }}</p>

        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">Bot Name</label>
            <Input
              v-model:model-value="form.name"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700"
              >Bot Username</label
            >
            <Input
              v-model:model-value="form.username"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700"
              >Telegram Token</label
            >
            <Input
              v-model:model-value="form.telegramToken"
              type="password"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700"
              >Webhook Secret</label
            >
            <Input
              v-model:model-value="form.webhookSecret"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>
        </div>

        <div class="mt-4 space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Description</label>
          <Textarea
            v-model:model-value="form.description"
            class="min-h-[110px] border-slate-200 bg-white shadow-none"
          />
        </div>

        <p
          v-if="message"
          class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        >
          {{ message }}
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <Button
            class="bg-slate-900 text-white shadow-none hover:bg-slate-800"
            @click="save"
          >
            Save Changes
          </Button>
          <Button
            variant="outline"
            class="border-slate-200 bg-white shadow-none"
            @click="publishToggle"
          >
            {{ bot.status === "published" ? "Move to Draft" : "Publish" }}
          </Button>
          <RouterLink :to="`/bots/${bot.id}/builder`">
            <Button
              variant="outline"
              class="border-slate-200 bg-white shadow-none"
            >
              Open Builder
            </Button>
          </RouterLink>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm font-semibold text-slate-900">Bot Runtime Summary</p>
        <div class="mt-3 space-y-2 text-sm text-slate-700">
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            Triggers: {{ bot.triggerCount }}
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            Actions: {{ bot.actionCount }}
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            Last Published:
            {{
              bot.lastPublishedAt
                ? new Date(bot.lastPublishedAt).toLocaleString()
                : "Never"
            }}
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            Token Preview: {{ maskToken(bot.telegramToken) }}
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
