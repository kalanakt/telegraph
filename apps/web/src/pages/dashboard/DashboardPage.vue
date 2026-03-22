<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBotsStore } from "@/stores/bots";
import { Bot, PlusSquare, Workflow } from "lucide-vue-next";
import { computed } from "vue";

const botsStore = useBotsStore();

const recentBots = computed(() => botsStore.bots.slice(0, 6));
</script>

<template>
  <AppShell
    title="Dashboard"
    subtitle="Track bot status, publishing, and account activity at a glance."
  >
    <template #actions>
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
            Published
          </p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">
            {{ botsStore.publishedBots }}
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
            Drafts
          </p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">
            {{ botsStore.draftBots }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="rounded-xl border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-4 py-3">
            <p class="text-sm font-semibold text-slate-900">Recent Bots</p>
            <p class="text-xs text-slate-500">
              Open builder, manage settings, or publish.
            </p>
          </div>

          <div class="divide-y divide-slate-200">
            <div
              v-for="bot in recentBots"
              :key="bot.id"
              class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p class="text-sm font-semibold text-slate-800">
                  {{ bot.name }}
                </p>
                <p class="text-xs text-slate-500">{{ bot.username }}</p>
              </div>

              <div class="flex items-center gap-2">
                <Badge
                  :class="
                    bot.status === 'published'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-amber-200 bg-amber-50 text-amber-700'
                  "
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

        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex items-center gap-2">
            <Workflow class="h-4 w-4 text-slate-600" />
            <p class="text-sm font-semibold text-slate-900">
              Builder Checklist
            </p>
          </div>
          <ul class="mt-3 space-y-2 text-sm text-slate-700">
            <li class="rounded-lg border border-slate-200 px-3 py-2">
              1. Create a bot with Telegram token and webhook secret.
            </li>
            <li class="rounded-lg border border-slate-200 px-3 py-2">
              2. Add triggers, conditions, and actions in the flow builder.
            </li>
            <li class="rounded-lg border border-slate-200 px-3 py-2">
              3. Save draft, test, publish, and monitor status.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AppShell>
</template>
