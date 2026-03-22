import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/index.css';
import { router } from './router';

const app = createApp(App);

app.use(createPinia());
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  },
});
app.use(router);

app.mount('#app');
