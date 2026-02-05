import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/route";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import { ToastService } from "primevue";
import Toast from "primevue/toast";
import "./style.css";

const app = createApp(App);

app.use(router);
app.use(ToastService);
app.component("Toast", Toast);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});

app.mount("#app");
