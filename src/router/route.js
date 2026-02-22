import { createRouter, createWebHistory } from "vue-router";
import FormLogin from "../components/FormLogin.vue";
import Dashboard from "../pages/Dashboard.vue";
import Chat from "../pages/Chat.vue";
import Document from "../pages/Document.vue";
import AuthLayout from "../layouts/AuthLayout.vue";
import MainLayout from "../layouts/MainLayout.vue";
import Tags from "../pages/Tags.vue";
import User from "../pages/User.vue";
import Profile from "../pages/Profile.vue";

import { useAuthStores } from "../stores/Auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: AuthLayout,
    children: [{ path: "", component: FormLogin }],
  },
  {
    path: "/Dashboard",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [{ path: "", component: Dashboard }],
  },
  {
    path: "/chat",
    name: "chat",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [{ path: "/chat", component: Chat }],
  },
  {
    path: "/document",
    name: "document",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [{ path: "/document", component: Document }],
  },
  {
    path: "/tags",
    name: "tags",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [{ path: "/tags", component: Tags }],
  },
  {
    path: "/user",
    name: "user",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [{ path: "/user", component: User }],
  },
  {
    path: "/profile",
    name: "profile",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [{ path: "/profile", component: Profile }],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("access_token");
  const auth = useAuthStores();
  if (to.meta.requiresAuth && !token) {
    auth.setMessage("Silakan login terlebih dahulu");
    next("/login");
  } else {
    next();
  }
});

export default router;
