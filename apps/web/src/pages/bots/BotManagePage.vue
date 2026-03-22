<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useBotsStore } from "@/stores/bots";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const authStore = useAuthStore();
const botsStore = useBotsStore();
const route = useRoute();

const botId = computed(() => String(route.params["botId"] ?? ""));
const bot = computed(() => botsStore.getBotById(botId.value));

const name = ref("");
const webhookBaseUrl = ref("");
const webhookUrl = ref("");
const message = ref("");
const saving = ref(false);
const webhookUpdating = ref(false);

watch(
  bot,
  (value) => {
    if (!value) return;
    name.value = value.name;
  },
  { immediate: true },
);

async function loadBot() {
  const token = authStore.token;
  if (!token) return;
  await botsStore.fetchBots(token);
}

async function saveName() {
  const token = authStore.token;
  if (!token || !bot.value) return;
  if (!name.value.trim()) {
    message.value = "Bot display name is required.";
    return;
  }

  saving.value = true;
  message.value = "";
  try {
    await botsStore.updateBot(token, bot.value.id, {
      name: name.value.trim(),
    });
    message.value = "Bot name saved.";
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : "Unable to save bot.";
  } finally {
    saving.value = false;
  }
}

async function registerWebhook() {
  const token = authStore.token;
  if (!token || !bot.value) return;
  if (!webhookBaseUrl.value.trim()) {
    message.value = "Webhook base URL is required.";
    return;
  }

  webhookUpdating.value = true;
  message.value = "";
  try {
    const result = await botsStore.registerWebhook(
      token,
      bot.value.id,
      webhookBaseUrl.value.trim(),
    );
    webhookUrl.value = result.webhookUrl;
    message.value = "Webhook registered.";
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : "Unable to register webhook.";
  } finally {
    webhookUpdating.value = false;
  }
}

async function removeWebhook() {
  const token = authStore.token;
  if (!token || !bot.value) return;

  webhookUpdating.value = true;
  message.value = "";
  try {
    await botsStore.removeWebhook(token, bot.value.id);
    webhookUrl.value = "";
    message.value = "Webhook removed.";
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : "Unable to remove webhook.";
  } finally {
    webhookUpdating.value = false;
  }
}

onMounted(async () => {
  await loadBot();
});
</script>

<template>
  <AppShell
    title="Manage Bot"
    subtitle="Update bot details and manually manage Telegram webhook registration."
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
            class="border border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            {{ bot.status }}
          </Badge>
        </div>
        <p class="mt-1 text-xs text-slate-500">
          {{ bot.username ? `@${bot.username}` : "No Telegram username" }}
        </p>

        <div class="mt-4 space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Display Name</label>
          <Input
            v-model:model-value="name"
            class="border-slate-200 bg-white shadow-none"
          />
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <Button
            class="bg-slate-900 text-white shadow-none hover:bg-slate-800"
            :disabled="saving"
            @click="saveName"
          >
            {{ saving ? "Saving..." : "Save Name" }}
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
        <p class="text-sm font-semibold text-slate-900">Webhook Setup</p>
        <p class="mt-1 text-xs text-slate-500">
          Enter your runtime base URL (for example, tunnel URL) to register:
          <code>/webhook/{{ bot.id }}</code
          >.
        </p>

        <div class="mt-4 space-y-1.5">
          <label class="text-sm font-medium text-slate-700"
            >Webhook Base URL</label
          >
          <Input
            v-model:model-value="webhookBaseUrl"
            placeholder="https://your-runtime.example.com"
            class="border-slate-200 bg-white shadow-none"
          />
        </div>

        <p
          v-if="webhookUrl"
          class="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
        >
          Registered URL: {{ webhookUrl }}
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <Button
            class="bg-slate-900 text-white shadow-none hover:bg-slate-800"
            :disabled="webhookUpdating"
            @click="registerWebhook"
          >
            {{ webhookUpdating ? "Updating..." : "Register Webhook" }}
          </Button>
          <Button
            variant="outline"
            class="border-slate-200 bg-white shadow-none"
            :disabled="webhookUpdating"
            @click="removeWebhook"
          >
            Remove Webhook
          </Button>
        </div>
      </div>
    </div>

    <p
      v-if="message"
      class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
    >
      {{ message }}
    </p>
  </AppShell>
</template>
