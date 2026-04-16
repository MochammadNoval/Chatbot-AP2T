import axios from "axios";
import { useAuthStores } from "../stores/Auth";

const api = axios.create({
  baseURL: "/api",
  timeout: 500000,
});

const publicPaths = ["/auth/login", "/auth/register"];
let isUnauthorized = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    const requestUrl = config.url || "";
    const isPublic = publicPaths.some((path) => requestUrl.includes(path));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    if (isPublic) {
      return config;
    }

    if (!isUnauthorized) {
      isUnauthorized = true;
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }

    return Promise.reject({
      response: {
        status: 401,
        data: { message: "Session habis atau token tidak ditemukan." },
      },
      message: "Session expired",
      config,
    });
  },
  (error) => Promise.reject(error),
);

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401 && !isUnauthorized) {
//       isUnauthorized = true;
//       localStorage.removeItem("access_token");
//       window.dispatchEvent(new CustomEvent("auth:expired"));
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   },
// );

export default api;
