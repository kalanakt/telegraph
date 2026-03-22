<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

async function submit() {
  errorMessage.value = "";

  try {
    loading.value = true;
    await authStore.signIn(email.value, password.value);
    const redirect = route.query["redirect"];
    const path = typeof redirect === "string" ? redirect : "/dashboard";
    await router.push(path);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to sign in.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div
      class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6"
    >
      <div>
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
          Telegraph
        </p>
        <h1 class="mt-1 text-2xl font-semibold text-slate-900">Sign In</h1>
        <p class="mt-1 text-sm text-slate-600">
          Continue to your Telegram bot workspace.
        </p>
      </div>

      <form class="mt-5 space-y-4" @submit.prevent="submit">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Email</label>
          <Input
            v-model:model-value="email"
            placeholder="you@company.com"
            class="border-slate-200 bg-white shadow-none"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Password</label>
          <Input
            v-model:model-value="password"
            type="password"
            placeholder="Enter password"
            class="border-slate-200 bg-white shadow-none"
          />
        </div>

        <p
          v-if="errorMessage"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>

        <Button
          type="submit"
          class="w-full bg-slate-900 text-white shadow-none hover:bg-slate-800"
          :disabled="loading"
        >
          {{ loading ? "Signing In..." : "Sign In" }}
        </Button>
      </form>

      <p class="mt-5 text-sm text-slate-600">
        New to Telegraph?
        <RouterLink
          to="/auth/sign-up"
          class="font-medium text-slate-900 underline"
        >
          Create account
        </RouterLink>
      </p>
    </div>
  </div>
</template>
