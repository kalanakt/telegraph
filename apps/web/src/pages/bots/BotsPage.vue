<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBotsStore } from "@/stores/bots";
import { PlusSquare, Search } from "lucide-vue-next";
import { computed, ref } from "vue";

const botsStore = useBotsStore();

const query = ref("");
const accountFilter = ref("all");

const filteredBots = computed(() => {
  const term = query.value.trim().toLowerCase();

  return botsStore.bots.filter((bot) => {
    const matchesAccount =
      accountFilter.value === "all" || bot.accountId === accountFilter.value;
    if (!matchesAccount) return false;

    if (!term) return true;
    return (
      bot.name.toLowerCase().includes(term) ||
      bot.username.toLowerCase().includes(term)
    );
  });
});

function accountName(accountId: string): string {
  return (
    botsStore.accounts.find((account) => account.id === accountId)?.name ??
    accountId
  );
}

function togglePublish(botId: string, status: "draft" | "published") {
  if (status === "published") {
    botsStore.unpublishBot(botId);
    return;
  }
  botsStore.publishBot(botId);
}
</script>

<template>
  <AppShell
    title="Bots"
    subtitle="Create, publish, and maintain Telegram bots across all accounts."
  >
    <template #actions>
      <RouterLink to="/bots/new">
        <Button class="bg-slate-900 text-white shadow-none hover:bg-slate-800">
          <PlusSquare class="mr-2 h-4 w-4" />
          Create Bot
        </Button>
      </RouterLink>
    </template>

    <div class="space-y-4">
      <div class="grid gap-3 md:grid-cols-[1fr_240px]">
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

        <Select v-model:model-value="accountFilter">
          <SelectTrigger class="border-slate-200 bg-white shadow-none">
            <SelectValue placeholder="Filter by account" />
          </SelectTrigger>
          <SelectContent class="shadow-none">
            <SelectItem value="all">All Accounts</SelectItem>
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

      <div class="rounded-xl border border-slate-200 bg-white">
        <div
          class="grid grid-cols-[2fr_1.2fr_0.9fr_1.8fr] border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
        >
          <p>Bot</p>
          <p>Account</p>
          <p>Status</p>
          <p>Actions</p>
        </div>

        <div
          v-if="filteredBots.length === 0"
          class="px-4 py-6 text-sm text-slate-500"
        >
          No bots found for this filter.
        </div>

        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="bot in filteredBots"
            :key="bot.id"
            class="grid grid-cols-[2fr_1.2fr_0.9fr_1.8fr] items-center gap-2 px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ bot.name }}</p>
              <p class="text-xs text-slate-500">{{ bot.username }}</p>
            </div>

            <p class="text-sm text-slate-700">
              {{ accountName(bot.accountId) }}
            </p>

            <Badge
              :class="
                bot.status === 'published'
                  ? 'w-fit border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'w-fit border border-amber-200 bg-amber-50 text-amber-700'
              "
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

              <Button
                variant="outline"
                class="h-8 border-slate-200 bg-white px-2.5 text-xs shadow-none"
                @click="togglePublish(bot.id, bot.status)"
              >
                {{ bot.status === "published" ? "Unpublish" : "Publish" }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
