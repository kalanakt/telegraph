<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBotsStore } from "@/stores/bots";
import { ref } from "vue";
import { useRouter } from "vue-router";

const botsStore = useBotsStore();
const router = useRouter();

const accountId = ref(botsStore.accounts[0]?.id ?? "");
const name = ref("");
const username = ref("");
const telegramToken = ref("");
const webhookSecret = ref("");
const description = ref("");
const errorMessage = ref("");
const creating = ref(false);

async function createBot() {
  errorMessage.value = "";

  if (
    !accountId.value ||
    !name.value.trim() ||
    !username.value.trim() ||
    !telegramToken.value.trim() ||
    !webhookSecret.value.trim()
  ) {
    errorMessage.value = "Please complete all required fields.";
    return;
  }

  creating.value = true;
  const bot = botsStore.createBot({
    accountId: accountId.value,
    name: name.value,
    username: username.value,
    telegramToken: telegramToken.value,
    webhookSecret: webhookSecret.value,
    description: description.value,
  });
  await router.push(`/bots/${bot.id}/builder`);
}
</script>

<template>
  <AppShell
    title="Create Telegram Bot"
    subtitle="Add API credentials and set up your first bot flow."
  >
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm font-semibold text-slate-900">Bot Configuration</p>
        <p class="mt-1 text-xs text-slate-500">
          Required fields are needed to save and start building.
        </p>

        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">Account</label>
            <Select v-model:model-value="accountId">
              <SelectTrigger class="border-slate-200 bg-white shadow-none">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent class="shadow-none">
                <SelectItem
                  v-for="account in botsStore.accounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">Bot Name</label>
            <Input
              v-model:model-value="name"
              placeholder="Support Assistant"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700"
              >Bot Username</label
            >
            <Input
              v-model:model-value="username"
              placeholder="@support_assistant_bot"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700"
              >Webhook Secret</label
            >
            <Input
              v-model:model-value="webhookSecret"
              placeholder="webhook-secret"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>
        </div>

        <div class="mt-4 space-y-1.5">
          <label class="text-sm font-medium text-slate-700"
            >Telegram Bot Token</label
          >
          <Input
            v-model:model-value="telegramToken"
            type="password"
            placeholder="123456:telegram-token"
            class="border-slate-200 bg-white shadow-none"
          />
        </div>

        <div class="mt-4 space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Description</label>
          <Textarea
            v-model:model-value="description"
            class="min-h-[110px] border-slate-200 bg-white shadow-none"
            placeholder="What this bot should do for users..."
          />
        </div>

        <p
          v-if="errorMessage"
          class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>

        <div class="mt-5 flex items-center gap-2">
          <Button
            class="bg-slate-900 text-white shadow-none hover:bg-slate-800"
            :disabled="creating"
            @click="createBot"
          >
            {{ creating ? "Creating..." : "Create and Open Builder" }}
          </Button>
          <RouterLink to="/bots">
            <Button
              variant="outline"
              class="border-slate-200 bg-white shadow-none"
            >
              Cancel
            </Button>
          </RouterLink>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm font-semibold text-slate-900">Setup Notes</p>
        <ul class="mt-3 space-y-2 text-sm text-slate-700">
          <li class="rounded-lg border border-slate-200 px-3 py-2">
            1. Create bot in BotFather and copy bot token.
          </li>
          <li class="rounded-lg border border-slate-200 px-3 py-2">
            2. Add a webhook secret for secure runtime validation.
          </li>
          <li class="rounded-lg border border-slate-200 px-3 py-2">
            3. Build triggers, conditions, and actions in flow builder.
          </li>
          <li class="rounded-lg border border-slate-200 px-3 py-2">
            4. Test, publish, and monitor bot status from dashboard.
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>
