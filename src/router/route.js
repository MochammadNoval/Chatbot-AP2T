import { createRouter, createWebHistory } from "vue-router";
import FormLogin from "../components/FormLogin.vue";
import Dashboard from "../pages/Dashboard.vue";
import Chat from "../pages/Chat.vue";
import Document from "../pages/Document.vue";
import AuthLayout from "../layouts/AuthLayout.vue";
import MainLayout from "../layouts/MainLayout.vue";
import Tags from "../pages/Tags.vue";
import User from "../pages/User.vue";

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
    children: [{ path: "", component: Dashboard }],
  },
  {
    path: "/chat",
    name: "chat",
    component: MainLayout,
    children: [{ path: "/chat", component: Chat }],
  },
  {
    path: "/document",
    name: "document",
    component: MainLayout,
    children: [{ path: "/document", component: Document }],
  },
  {
    path: "/tags",
    name: "tags",
    component: MainLayout,
    children: [{ path: "/tags", component: Tags }],
  },
  {
    path: "/user",
    name: "user",
    component: MainLayout,
    children: [{ path: "/user", component: User }],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// router.beforeEach((to, from, next) => {
//   const publicPages = ["/login"];
//   const auth = useAuthStores();
//   const authRequired = !publicPages.includes(to.path);
//   if (authRequired && !auth.loggedIn) {
//     auth.setMessage("silahkan untuk login terlebih dahulu");
//     next("/login");
//   } else {
//     next();
//   }
// });

export default router;
