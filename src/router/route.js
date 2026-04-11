import { createRouter, createWebHistory } from "vue-router";
import Login from "../pages/Login.vue";
import Dashboard from "../pages/Dashboard.vue";
import Chat from "../pages/Chat.vue";
import Document from "../pages/Document.vue";
import AuthLayout from "../layouts/AuthLayout.vue";
import MainLayout from "../layouts/MainLayout.vue";
import Tags from "../pages/Tags.vue";
import User from "../pages/User.vue";
import Profile from "../pages/Profile.vue";
import NotFound from "../pages/NotFound.vue";
import Maintenance from "../pages/UnderMaintenance.vue"

import { useAuthStores } from "../stores/Auth";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: AuthLayout,
    children: [{ path: "", component: Login }],
  },
  {
    path: "/document",
    name: "document",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "/dashboard",
        name: "dashboard",
        component: Dashboard,
      },
      {
        path: "/chat",
        name: "chat",
        component: Chat,
      },
      {
        path: "/document",
        name: "document-home",
        component: Document,
      },
      {
        path: "/tags",
        name: "tags",
        component: Tags,
      },
      {
        path: "/user",
        name: "user",
        component: User,
      },
      {
        path: "/profile",
        name: "profile",
        component: Profile,
      },
    ],
  },
  {
    path: "/talent-management",
    name: "talent-management",
    component: Maintenance,
    meta: { requiresAuth: true },
  },
  {
    path: "/setting",
    name: "setting",
    component: Maintenance,
    meta: { requiresAuth: true },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFound,
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
