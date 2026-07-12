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
import DashboardSertifikasi from "../pages/DashboardSertifikasi.vue"


import { useAuthStores } from "../stores/Auth";
import NotAllowed from "../pages/NotAllowed.vue";
import ProtectedPreview from "../pages/ProtectedPreview.vue";
import TalentManagement from "../pages/Talent-Management.vue";


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
    path: '/share/:token',
    name: "protectedPreview",
    component: AuthLayout,
    children: [{ path: "", component: ProtectedPreview }],
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
        meta: {
          permissions: ['admin : view']
        }
      },
      {
        path: "/user",
        name: "user",
        component: User,
        meta: {
          permissions: ['admin : view']
        }
      },
      {
        path: "/profile",
        name: "profile",
        component: Profile,
      },
      {
        path: "/dashboard-sertifikasi",
        name: "dashboard-sertifikasi",
        component: DashboardSertifikasi,
      },
      {
        path: "/talent-management",
        name: "talent-management",
        component: TalentManagement,
      },
      {
        path: "/403",
        name: "403",
        component: NotAllowed
      },
      {
        path: "/setting",
        name: "setting",
        component: Maintenance,
      },

      {
        path: "/profile",
        name: "profile",
        component: Maintenance,
      },
    ],
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
    return;
  }
  
  if (token && auth.user?.role?.toUpperCase() === 'AP2T') {
    const allowedPathsForAP2T = ['/chat', '/document', '/profile', '/403', '/login'];
    const isAllowed = allowedPathsForAP2T.some(path => to.path.startsWith(path));
    if (!isAllowed) {
      auth.setMessage("Anda tidak memiliki akses untuk halaman ini");
      next("/chat");
      return;
    }
  }

  if (to.meta.permissions) {
    console.log("User:", auth.user)
    console.log("User Permissions:", auth.user?.permissions)
    console.log("Required:", to.meta.permissions)

    const allowed = to.meta.permissions.every(permissions =>
      auth.user?.permissions.includes(permissions)
    )

    console.log("Allowed", allowed);


    if (!allowed) {
      auth.setMessage("Anda tidak memiliki akses untuk halaman ini");
      next("/403");
    } else {
      next();
    }
  }
  else {
    next();
  }
});

export default router;
