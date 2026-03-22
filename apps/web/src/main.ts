import { VueQueryPlugin } from "@tanstack/vue-query";
import { createApp } from "vue";
import App from "./App.vue";
import "./assets/index.css";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import { pinia } from "./stores";

const app = createApp(App);

app.use(pinia);
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  },
});
app.use(router);

useAuthStore(pinia).hydrate();

app.mount("#app");
