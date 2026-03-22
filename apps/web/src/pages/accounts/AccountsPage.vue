<script setup lang="ts">
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBotsStore } from "@/stores/bots";
import { Building2, PlusSquare, Search } from "lucide-vue-next";
import { computed, ref } from "vue";

const botsStore = useBotsStore();

const query = ref("");
const newAccountName = ref("");
const newAccountOwner = ref("");
const message = ref("");

const filteredAccounts = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return botsStore.accounts;
  return botsStore.accounts.filter((account) =>
    account.name.toLowerCase().includes(term),
  );
});

function botCount(accountId: string): number {
  return botsStore.bots.filter((bot) => bot.accountId === accountId).length;
}

function createAccount() {
  message.value = "";
  if (!newAccountName.value.trim() || !newAccountOwner.value.trim()) {
    message.value = "Account name and owner are required.";
    return;
  }

  const account = botsStore.createAccount({
    name: newAccountName.value,
    owner: newAccountOwner.value,
  });

  newAccountName.value = "";
  newAccountOwner.value = "";
  message.value = `Account "${account.name}" created.`;
}
</script>

<template>
  <AppShell
    title="Accounts"
    subtitle="Manage workspace accounts and assign bots by team."
  >
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div class="rounded-xl border border-slate-200 bg-white">
        <div
          class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
        >
          <div class="flex items-center gap-2">
            <Building2 class="h-4 w-4 text-slate-600" />
            <p class="text-sm font-semibold text-slate-900">
              Workspace Accounts
            </p>
          </div>
          <div
            class="flex items-center rounded-md border border-slate-200 bg-white px-3"
          >
            <Search class="h-4 w-4 text-slate-400" />
            <Input
              v-model:model-value="query"
              placeholder="Search accounts"
              class="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
        </div>

        <div class="divide-y divide-slate-200">
          <div
            v-for="account in filteredAccounts"
            :key="account.id"
            class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold text-slate-800">
                {{ account.name }}
              </p>
              <p class="text-xs text-slate-500">
                Owner: {{ account.owner }} · Bots: {{ botCount(account.id) }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <Badge
                :class="
                  account.status === 'active'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-amber-200 bg-amber-50 text-amber-700'
                "
              >
                {{ account.status }}
              </Badge>
              <Button
                variant="outline"
                class="h-8 border-slate-200 bg-white px-2.5 text-xs shadow-none"
                @click="botsStore.toggleAccountStatus(account.id)"
              >
                {{ account.status === "active" ? "Pause" : "Activate" }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="text-sm font-semibold text-slate-900">Create Account</p>
        <p class="mt-1 text-xs text-slate-500">
          Add a new workspace to organize bots by team or client.
        </p>

        <div class="mt-4 space-y-3">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700"
              >Account Name</label
            >
            <Input
              v-model:model-value="newAccountName"
              placeholder="Growth Team Workspace"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">Owner</label>
            <Input
              v-model:model-value="newAccountOwner"
              placeholder="Owner name"
              class="border-slate-200 bg-white shadow-none"
            />
          </div>
        </div>

        <p
          v-if="message"
          class="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        >
          {{ message }}
        </p>

        <Button
          class="mt-4 bg-slate-900 text-white shadow-none hover:bg-slate-800"
          @click="createAccount"
        >
          <PlusSquare class="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>
    </div>
  </AppShell>
</template>
