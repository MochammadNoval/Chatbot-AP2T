import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/route";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import "./style.css";
import ToastService from "primevue/toastservice";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate"

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(router);
app.use(PrimeVue);
app.use(ToastService);
app.use(pinia);

app.mount("#app");
