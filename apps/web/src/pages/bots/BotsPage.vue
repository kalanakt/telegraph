<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useBotsStore } from "@/stores/bots";
import { PlusSquare, RefreshCw, Search } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const authStore = useAuthStore();
const botsStore = useBotsStore();

const query = ref("");
const loading = ref(false);
const errorMessage = ref("");

const filteredBots = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return botsStore.bots;

  return botsStore.bots.filter((bot) => {
    const username = bot.username ?? "";
    return (
      bot.name.toLowerCase().includes(term) ||
      username.toLowerCase().includes(term)
    );
  });
});

async function loadBots() {
  const token = authStore.token;
  if (!token) return;

  errorMessage.value = "";
  loading.value = true;
  try {
    await botsStore.fetchBots(token);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load bots.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadBots();
});
</script>

<template>
  <AppShell
    title="Bots"
    subtitle="Create and manage Telegram bots connected to your workspace."
  >
    <template #actions>
      <Button
        variant="outline"
        class="border-slate-200 bg-white shadow-none"
        :disabled="loading"
        @click="loadBots"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        Refresh
      </Button>
      <RouterLink to="/bots/new">
        <Button class="bg-slate-900 text-white shadow-none hover:bg-slate-800">
          <PlusSquare class="mr-2 h-4 w-4" />
          Create Bot
        </Button>
      </RouterLink>
    </template>

    <div class="space-y-4">
      <div
        class="flex items-center rounded-md border border-slate-200 bg-white px-3"
      >
        <Search class="h-4 w-4 text-slate-400" />
        <Input
          v-model:model-value="query"
          placeholder="Search bots by name or username"
          class="border-0 bg-transparent focus-visible:ring-0"
        />
      </div>

      <p
        v-if="errorMessage"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>

      <div class="rounded-xl border border-slate-200 bg-white">
        <div
          class="grid grid-cols-[2fr_1fr_1.7fr] border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
        >
          <p>Bot</p>
          <p>Status</p>
          <p>Actions</p>
        </div>

        <div v-if="loading" class="px-4 py-6 text-sm text-slate-500">
          Loading bots...
        </div>

        <div
          v-else-if="filteredBots.length === 0"
          class="px-4 py-6 text-sm text-slate-500"
        >
          No bots found.
        </div>

        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="bot in filteredBots"
            :key="bot.id"
            class="grid grid-cols-[2fr_1fr_1.7fr] items-center gap-2 px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ bot.name }}</p>
              <p class="text-xs text-slate-500">
                {{
                  bot.username
                    ? `@${bot.username}`
                    : "No username returned by Telegram"
                }}
              </p>
            </div>

            <Badge
              class="w-fit border border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              {{ bot.status }}
            </Badge>

            <div class="flex flex-wrap items-center gap-2">
              <RouterLink :to="`/bots/${bot.id}/builder`">
                <Button
                  variant="outline"
                  class="h-8 border-slate-200 bg-white px-2.5 text-xs shadow-none"
                >
                  Builder
                </Button>
              </RouterLink>

              <RouterLink :to="`/bots/${bot.id}/manage`">
                <Button
                  variant="outline"
                  class="h-8 border-slate-200 bg-white px-2.5 text-xs shadow-none"
                >
                  Manage
                </Button>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
