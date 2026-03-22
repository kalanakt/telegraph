import { useAuthStore } from "@/stores/auth";
import { pinia } from "@/stores";
import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/auth/sign-in",
      name: "sign-in",
      component: () => import("@/pages/auth/SignInPage.vue"),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: "/auth/sign-up",
      name: "sign-up",
      component: () => import("@/pages/auth/SignUpPage.vue"),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/pages/dashboard/DashboardPage.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/bots",
      name: "bots",
      component: () => import("@/pages/bots/BotsPage.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/accounts",
      name: "accounts",
      component: () => import("@/pages/accounts/AccountsPage.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/bots/new",
      name: "create-bot",
      component: () => import("@/pages/bots/CreateBotPage.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/bots/:botId/builder",
      name: "bot-builder",
      component: () => import("@/pages/bots/BotBuilderPage.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/bots/:botId/manage",
      name: "bot-manage",
      component: () => import("@/pages/bots/BotManagePage.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/studio",
      redirect: "/dashboard",
    },
    {
      path: "/login",
      redirect: "/auth/sign-in",
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia);
  authStore.hydrate();

  const requiresAuth = Boolean(to.meta["requiresAuth"]);
  const guestOnly = Boolean(to.meta["guestOnly"]);

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "sign-in",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (guestOnly && authStore.isAuthenticated) {
    return {
      name: "dashboard",
    };
  }

  return true;
});
