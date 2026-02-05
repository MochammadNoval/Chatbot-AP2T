import { createRouter, createWebHistory } from "vue-router";
import FormLogin from "../components/FormLogin.vue";
import Dashboard from "../pages/Dashboard.vue";
import Chat from "../pages/Chat.vue";
import ManagementFile from "../pages/ManagementFile.vue";
import AuthLayout from "../layouts/AuthLayout.vue";
import MainLayout from "../layouts/MainLayout.vue";

const routes = [
  {
    path: "/login",
    component: AuthLayout,
    children: [{ path: "", component: FormLogin }],
  },
  {
    path: "/Dashboard",
    component: MainLayout,
    children: [{ path: "", component: Dashboard }],
  },
  {
    path: "/chat",
    component: MainLayout,
    children: [{ path: "/chat", component: Chat }],
  },
  {
    path: "/ManagementFile",
    name: "ManagementFile",
    component: ManagementFile,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
