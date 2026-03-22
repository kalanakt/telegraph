<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth";
import {
  Building2,
  Bot,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PlusSquare,
} from "lucide-vue-next";
import { computed, ref, type Component } from "vue";
import { useRoute, useRouter } from "vue-router";

defineProps<{
  title: string;
  subtitle: string;
}>();

interface NavItem {
  label: string;
  to: string;
  icon: Component;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Bots",
    to: "/bots",
    icon: Bot,
  },
  {
    label: "Accounts",
    to: "/accounts",
    icon: Building2,
  },
  {
    label: "Create Bot",
    to: "/bots/new",
    icon: PlusSquare,
  },
];

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mobileNavOpen = ref(false);
const sidebarExpanded = ref(true);

const shellGridClass = computed(() =>
  sidebarExpanded.value
    ? "lg:grid-cols-[240px_1fr]"
    : "lg:grid-cols-[78px_1fr]",
);

const activeLabel = computed(() => {
  if (route.path.startsWith("/bots/new")) return "Create Bot";
  if (route.path.startsWith("/bots")) return "Bots";
  if (route.path.startsWith("/accounts")) return "Accounts";
  if (route.path.startsWith("/dashboard")) return "Dashboard";
  return "Dashboard";
});

function signOut() {
  authStore.signOut();
  router.push("/auth/sign-in");
}

function itemClass(item: NavItem): string {
  const active =
    (item.label === "Dashboard" && route.path.startsWith("/dashboard")) ||
    (item.label === "Accounts" && route.path.startsWith("/accounts")) ||
    (item.label === "Bots" &&
      route.path.startsWith("/bots") &&
      !route.path.startsWith("/bots/new")) ||
    (item.label === "Create Bot" && route.path.startsWith("/bots/new"));

  if (active) {
    return sidebarExpanded.value
      ? "flex w-full items-center gap-2.5 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-left text-white"
      : "flex w-full items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-2 py-2 text-white";
  }
  return sidebarExpanded.value
    ? "flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left text-slate-700 hover:border-slate-200 hover:bg-white"
    : "flex w-full items-center justify-center rounded-lg border border-transparent px-2 py-2 text-slate-700 hover:border-slate-200 hover:bg-white";
}

function closeMobileNav() {
  mobileNavOpen.value = false;
}

function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value;
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div
      class="grid min-h-screen transition-all duration-200"
      :class="shellGridClass"
    >
      <aside
        class="hidden border-r border-border bg-sidebar lg:flex lg:flex-col"
      >
        <div class="border-b border-border px-4 py-4">
          <div class="flex items-center justify-between gap-2.5">
            <div
              v-if="sidebarExpanded"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white"
            >
              <Bot class="h-4.5 w-4.5 text-slate-700" />
            </div>
            <div v-if="sidebarExpanded">
              <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
                Telegraph
              </p>
              <p class="text-sm font-semibold text-slate-900">Bot Builder</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="ml-auto h-8 w-8 text-slate-600 hover:bg-slate-100"
              @click="toggleSidebar"
            >
              <PanelLeftClose v-if="sidebarExpanded" class="h-4 w-4" />
              <PanelLeftOpen v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav class="space-y-1 py-3" :class="sidebarExpanded ? 'px-3' : 'px-2'">
          <RouterLink
            v-for="item in navItems"
            :key="item.label"
            :class="itemClass(item)"
            :to="item.to"
            :title="item.label"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">{{
              item.label
            }}</span>
          </RouterLink>
        </nav>

        <div
          class="mt-auto border-t border-border py-3"
          :class="sidebarExpanded ? 'px-4' : 'px-2'"
        >
          <p v-if="sidebarExpanded" class="text-xs text-slate-500">
            {{ authStore.user?.email }}
          </p>
          <Button
            variant="outline"
            :size="sidebarExpanded ? 'default' : 'icon'"
            :class="
              sidebarExpanded
                ? 'mt-2 w-full border-slate-200 bg-white shadow-none'
                : 'w-full border-slate-200 bg-white shadow-none'
            "
            :title="sidebarExpanded ? undefined : 'Sign Out'"
            @click="signOut"
          >
            <LogOut class="h-4 w-4" :class="sidebarExpanded ? 'mr-2' : ''" />
            <span v-if="sidebarExpanded">Sign Out</span>
          </Button>
        </div>
      </aside>

      <div class="flex min-h-screen flex-col">
        <header class="border-b border-border bg-white px-4 py-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
                {{ activeLabel }}
              </p>
              <h1 class="text-lg font-semibold text-slate-900">{{ title }}</h1>
              <p class="text-sm text-slate-600">{{ subtitle }}</p>
            </div>

            <div class="flex items-center gap-2">
              <slot name="actions" />

              <Sheet v-model:open="mobileNavOpen">
                <SheetTrigger as-child>
                  <Button
                    variant="outline"
                    size="icon"
                    class="border-slate-200 bg-white shadow-none lg:hidden"
                  >
                    <Menu class="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  class="w-[90vw] max-w-sm border-slate-200 bg-white"
                >
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription
                      >Go to dashboard, bots, and builder
                      pages.</SheetDescription
                    >
                  </SheetHeader>
                  <nav class="mt-4 space-y-2">
                    <RouterLink
                      v-for="item in navItems"
                      :key="`mobile-${item.label}`"
                      :to="item.to"
                      :class="itemClass(item)"
                      @click="closeMobileNav"
                    >
                      <component :is="item.icon" class="h-4 w-4" />
                      <span class="text-sm font-medium">{{ item.label }}</span>
                    </RouterLink>
                  </nav>
                  <Button
                    variant="outline"
                    class="mt-4 w-full border-slate-200 bg-white shadow-none"
                    @click="signOut"
                  >
                    <LogOut class="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-auto p-4">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
