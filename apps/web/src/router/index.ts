import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/studio",
    },
    {
      path: "/studio",
      component: () => import("@/pages/studio/FlowStudioPage.vue"),
    },
    {
      path: "/login",
      redirect: "/studio",
    },
  ],
});
