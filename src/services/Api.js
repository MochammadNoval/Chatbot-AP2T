import axios from "axios";
import { useAuthStores } from "../stores/Auth";
import { isTokenExpired, isTokenExpiringSoon } from "../utils/tokenUtils";

const api = axios.create({
  baseURL: "/api",
  timeout: 500000,
});

const publicPaths = ["/auth/login", "/auth/register", "/auth/refresh"];
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    const requestUrl = config.url || "";
    const fullUrl = `${config.baseURL}${requestUrl}`;
    
    
    // Cek apakah ini public path (login, register, refresh)
    // Gunakan multiple checks untuk robustness
    const isPublic = 
      requestUrl === "/auth/login" || 
      requestUrl === "/auth/register" || 
      requestUrl === "/auth/refresh" ||
      requestUrl.endsWith("/auth/login") || 
      requestUrl.endsWith("/auth/register") || 
      requestUrl.endsWith("/auth/refresh") ||
      requestUrl.includes("auth/login") ||
      requestUrl.includes("auth/register") ||
      requestUrl.includes("auth/refresh");
    
    // Untuk public paths, langsung return config (tidak perlu cek token)
    if (isPublic) {
      return config;
    }
    
    const token = localStorage.getItem("access_token");
    let expiryTime = localStorage.getItem("token_expiry_time");
    
    // Safety: Jika ada token tapi tidak ada expiry time, set default
    if (token && !expiryTime) {
      console.warn("[API Request] Token exists but no expiry time! Setting default (15 min)");
      const DEFAULT_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
      expiryTime = (Date.now() + DEFAULT_EXPIRY_MS).toString();
      localStorage.setItem("token_expiry_time", expiryTime);
    }
    
    // Jika tidak ada token sama sekali, redirect ke login
    if (!token) {
      console.log("[API Request] No token - rejecting");
      window.dispatchEvent(new CustomEvent("auth:expired"));
      return Promise.reject({
        response: {
          status: 401,
          data: { message: "Token tidak ditemukan. Silakan login kembali." },
        },
        message: "No token",
        config,
      });
    }
    
    // Cek apakah token sudah expired atau akan expired
    const tokenExpired = isTokenExpired(expiryTime);
    const tokenExpiringSoon = isTokenExpiringSoon(expiryTime, 60);
    
    
    if (tokenExpired || tokenExpiringSoon) {
      const refreshToken = localStorage.getItem("refresh_token");
      
      console.log("[API Request] Token expired/expiring - attempting refresh, has refreshToken:", !!refreshToken);
      
      if (!refreshToken) {
        // Tidak ada refresh token, logout
        console.log("[API Request] No refresh token - logging out");
        const authStore = useAuthStores();
        authStore.logout();
        window.dispatchEvent(new CustomEvent("auth:expired"));
        return Promise.reject({
          response: {
            status: 401,
            data: { message: "Session habis atau token tidak ditemukan." },
          },
          message: "Session expired",
          config,
        });
      }
      
      // Jika sudah ada yang refresh, tunggu hasilnya
      if (isRefreshing) {
        console.log("[API Request] Already refreshing - queuing request");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        }).catch(error => {
          return Promise.reject(error);
        });
      }
      
      // Mulai proses refresh
      isRefreshing = true;
      console.log("[API Request] Starting token refresh");
      
      try {
        // Buat axios instance baru untuk refresh token (bypass interceptor)
        const refreshApi = axios.create({
          baseURL: "/api",
          timeout: 500000,
        });
        
        const response = await refreshApi.post("/auth/refresh", {
          refresh_token: refreshToken
        });
        
        const { access_token, refresh_token, expires_in } = response.data;
        
        console.log("[API Request] Token refresh successful");
        
        // Update token di localStorage
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("token_expiry_time", (Date.now() + (expires_in * 1000)).toString());
        
        // Update store
        const authStore = useAuthStores();
        authStore.access_token = access_token;
        authStore.refresh_token = refresh_token;
        authStore.token_expiry_time = Date.now() + (expires_in * 1000);
        
        // Set token untuk request saat ini
        config.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        return config;
      } catch (error) {
        // Refresh gagal, logout
        const authStore = useAuthStores();
        authStore.logout();
        window.dispatchEvent(new CustomEvent("auth:expired"));
        
        processQueue(error, null);
        return Promise.reject({
          response: {
            status: 401,
            data: { message: "Token refresh gagal. Silakan login kembali." },
          },
          message: "Token refresh failed",
          config,
        });
      }
    }
    
    // Add token ke header jika ada dan valid
    if (token && !isTokenExpired(expiryTime)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor untuk handle 401 error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStores();
      authStore.logout();
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  },
);

export default api;
