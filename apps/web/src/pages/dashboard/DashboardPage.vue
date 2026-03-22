<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useBotsStore } from "@/stores/bots";
import { Bot, PlusSquare, RefreshCw } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const authStore = useAuthStore();
const botsStore = useBotsStore();

const loading = ref(false);
const errorMessage = ref("");

const recentBots = computed(() => botsStore.bots.slice(0, 6));
const activeCount = computed(
  () => botsStore.bots.filter((bot) => bot.status === "active").length,
);

async function loadBots() {
  const token = authStore.token;
  if (!token) return;

  errorMessage.value = "";
  loading.value = true;
  try {
    await botsStore.fetchBots(token);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load dashboard data.";
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
    title="Dashboard"
    subtitle="Track bots and jump quickly into builder or settings."
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
        <Button variant="outline" class="border-slate-200 bg-white shadow-none">
          <PlusSquare class="mr-2 h-4 w-4" />
          New Bot
        </Button>
      </RouterLink>
      <RouterLink to="/bots">
        <Button class="bg-slate-900 text-white shadow-none hover:bg-slate-800">
          <Bot class="mr-2 h-4 w-4" />
          Manage Bots
        </Button>
      </RouterLink>
    </template>

    <div class="space-y-4">
      <p
        v-if="errorMessage"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>

      <div class="grid gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
            Total Bots
          </p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">
            {{ botsStore.bots.length }}
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
            Active Bots
          </p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">
            {{ activeCount }}
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            {{ authStore.tenant?.name ?? "Unknown" }}
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white">
        <div class="border-b border-slate-200 px-4 py-3">
          <p class="text-sm font-semibold text-slate-900">Recent Bots</p>
          <p class="text-xs text-slate-500">
            Open builder or webhook settings for each bot.
          </p>
        </div>

        <div v-if="loading" class="px-4 py-6 text-sm text-slate-500">
          Loading recent bots...
        </div>

        <div
          v-else-if="recentBots.length === 0"
          class="px-4 py-6 text-sm text-slate-500"
        >
          No bots created yet.
        </div>

        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="bot in recentBots"
            :key="bot.id"
            class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-slate-800">
                {{ bot.name }}
              </p>
              <p class="text-xs text-slate-500">
                {{ bot.username ? `@${bot.username}` : "No username" }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <Badge
                class="border border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                {{ bot.status }}
              </Badge>
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
