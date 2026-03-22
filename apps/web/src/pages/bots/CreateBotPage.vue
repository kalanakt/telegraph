<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useBotsStore } from "@/stores/bots";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const botsStore = useBotsStore();
const router = useRouter();

const name = ref("");
const telegramToken = ref("");
const errorMessage = ref("");
const creating = ref(false);

const canCreate = computed(
  () => name.value.trim().length > 0 && telegramToken.value.trim().length > 0,
);

async function createBot() {
  errorMessage.value = "";
  const token = authStore.token;
  if (!token) {
    errorMessage.value = "Your session has expired. Sign in again.";
    return;
  }
  if (!canCreate.value) {
    errorMessage.value = "Display name and Telegram API token are required.";
    return;
  }

  creating.value = true;
  try {
    const bot = await botsStore.createBot(token, {
      name: name.value,
      token: telegramToken.value,
    });
    await router.push(`/bots/${bot.id}/builder`);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to create bot.";
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <AppShell
    title="Create Telegram Bot"
    subtitle="Add display name and API token. We validate the token from Telegram on the backend."
  >
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm font-semibold text-slate-900">Bot Configuration</p>
        <p class="mt-1 text-xs text-slate-500">
          We fetch bot username/details from Telegram using this token.
        </p>

        <div class="mt-4 space-y-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700"
              >Display Name</label
            >
            <Input
              v-model:model-value="name"
              placeholder="Support Assistant"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>

          <div class="space-y-1.5">
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
            1. Create your bot in BotFather and copy its token.
          </li>
          <li class="rounded-lg border border-slate-200 px-3 py-2">
            2. Build the flow in Builder and publish it.
          </li>
          <li class="rounded-lg border border-slate-200 px-3 py-2">
            3. Register webhook manually from Manage Bot when runtime URL is
            ready.
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>
