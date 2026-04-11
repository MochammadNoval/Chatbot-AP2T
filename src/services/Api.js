import axios from "axios";
import { useAuthStores } from "../stores/Auth";

const api = axios.create({
  baseURL: "/api",
  timeout: 500000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Flag untuk mencegah multiple event dispatch
let isUnauthorized = false;

api.interceptors.response.use((response)=> response,
(error) => {
  const store = useAuthStores()
  if (error.response && error.response.status === 401 && !isUnauthorized){
    isUnauthorized = true; // ✅ Set flag untuk mencegah duplicate
    store.handleUnauthorized()
    window.dispatchEvent(new CustomEvent("auth:expired"))
    window.location.href = "/login";
  }
  return Promise.reject(error)
})

export default api;
