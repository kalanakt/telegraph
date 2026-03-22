<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useBotsStore } from "@/stores/bots";
import { Building2, RefreshCw } from "lucide-vue-next";
import { onMounted, ref } from "vue";

const authStore = useAuthStore();
const botsStore = useBotsStore();

const loading = ref(false);
const errorMessage = ref("");

async function loadSummary() {
  const token = authStore.token;
  if (!token) return;

  loading.value = true;
  errorMessage.value = "";
  try {
    await botsStore.fetchBots(token);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load workspace info.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadSummary();
});
</script>

<template>
  <AppShell
    title="Workspace"
    subtitle="Current tenant and account-level context for this MVP."
  >
    <template #actions>
      <Button
        variant="outline"
        class="border-slate-200 bg-white shadow-none"
        :disabled="loading"
        @click="loadSummary"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </template>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="flex items-center gap-2">
          <Building2 class="h-4 w-4 text-slate-600" />
          <p class="text-sm font-semibold text-slate-900">Workspace Details</p>
        </div>

        <p
          v-if="errorMessage"
          class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>

        <dl class="mt-4 space-y-3 text-sm">
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            <dt class="text-xs uppercase tracking-[0.12em] text-slate-500">
              Name
            </dt>
            <dd class="mt-1 font-medium text-slate-900">
              {{ authStore.tenant?.name ?? "Unknown" }}
            </dd>
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            <dt class="text-xs uppercase tracking-[0.12em] text-slate-500">
              Slug
            </dt>
            <dd class="mt-1 font-medium text-slate-900">
              {{ authStore.tenant?.slug ?? "Unknown" }}
            </dd>
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            <dt class="text-xs uppercase tracking-[0.12em] text-slate-500">
              Your Role
            </dt>
            <dd class="mt-1 font-medium text-slate-900">
              {{ authStore.user?.role ?? "Unknown" }}
            </dd>
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            <dt class="text-xs uppercase tracking-[0.12em] text-slate-500">
              Email
            </dt>
            <dd class="mt-1 font-medium text-slate-900">
              {{ authStore.user?.email ?? "Unknown" }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm font-semibold text-slate-900">Workspace Summary</p>
        <div class="mt-3 space-y-2 text-sm text-slate-700">
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            Bots: {{ botsStore.bots.length }}
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            Active Bots: {{ botsStore.activeBots.length }}
          </div>
          <div class="rounded-lg border border-slate-200 px-3 py-2">
            <Badge
              class="border border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              Payments disabled in MVP
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
