import { defineStore } from "pinia";
import { isTokenExpired, isTokenExpiringSoon, calculateTokenExpiryTime } from "../utils/tokenUtils";
import { ROLE_PERMISSIONS } from "../constants/roles";

export const useAuthStores = defineStore("auth", {
  state: () => ({
    user: null,
    username: "",
    loggedIn: false,
    isAdmin: false,
    message: null,
    isLoading: false,
    sessionExpired: false,
    access_token: null,
    refresh_token: null,
    token_expiry_time: null,
    expires_in: null  // Token duration dalam detik dari backend
  }),
  persist: true,

  getters: {
    isTokenExpired: (state) => {
      return isTokenExpired(state.token_expiry_time);
    },
    isTokenExpiringSoon: (state) => {
      return isTokenExpiringSoon(state.token_expiry_time, 60);
    }
  },
  actions: {
    login(user, tokens = {}) {
      this.username = user.name;
      this.loggedIn = true;

      // Simpan tokens
      this.access_token = tokens.access_token || localStorage.getItem("access_token");
      this.refresh_token = tokens.refresh_token || null;

      // Simpan expires_in (duration dalam detik)
      if (tokens.expires_in) {
        this.expires_in = tokens.expires_in;
        console.log('[Auth Store] 📝 login: expires_in stored -', tokens.expires_in, 'seconds');
      }

      // Set token expiry time using utility function
      if (tokens.expires_in) {
        this.token_expiry_time = calculateTokenExpiryTime(tokens.expires_in);
      }

      // Simpan ke localStorage
      if (tokens.access_token) {
        localStorage.setItem("access_token", tokens.access_token);
      }
      if (tokens.refresh_token) {
        localStorage.setItem("refresh_token", tokens.refresh_token);
      }
      if (tokens.expires_in) {
        localStorage.setItem("token_expires_in", tokens.expires_in.toString());
      }
      if (this.token_expiry_time) {
        localStorage.setItem("token_expiry_time", this.token_expiry_time.toString());
        console.log('[Auth Store] ✅ login: tokens saved to localStorage', {
          expires_in: tokens.expires_in,
          expiry_time: this.token_expiry_time,
          expiry_date: new Date(this.token_expiry_time).toLocaleString()
        });
      }

      localStorage.setItem("username", user.name);
      localStorage.setItem("loggedIn", true);
      localStorage.setItem("user_id", user.id);
    },

    logout() {
      this.username = "";
      this.loggedIn = false;
      this.isAdmin = false;
      this.access_token = null;
      this.refresh_token = null;
      this.token_expiry_time = null;
      this.expires_in = null;

      console.log('[Auth Store] 🔓 logout: clearing all tokens');
      localStorage.removeItem("username");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("user_id");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_expiry_time");
      localStorage.removeItem("token_expires_in");  // Remove stored expires_in
    },

    setUser(userData) {
      const roleKey = Object.keys(ROLE_PERMISSIONS).find(
        (k) => k.toLowerCase() === (userData.role || "").toLowerCase()
      ) || userData.role;
      const permissions = ROLE_PERMISSIONS[roleKey] || [];
      this.user = {
        ...userData, permissions
      }
      localStorage.setItem("ROLE", JSON.stringify(permissions))
    },

    handleUnauthorized() {
      if (this.sessionExpired) return;
      this.sessionExpired = true;
      this.logout()
    },

    async refreshToken(authService) {
      try {
        if (!this.refresh_token) {
          throw new Error("No refresh token available");
        }

        const response = await authService.refreshToken(this.refresh_token);

        // Update tokens
        this.access_token = response.access_token;
        this.refresh_token = response.refresh_token;
        this.token_expiry_time = Date.now() + (response.expires_in * 1000);

        // Simpan ke localStorage
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        localStorage.setItem("token_expiry_time", this.token_expiry_time.toString());

        return response;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    setMessage(msg) {
      this.message = msg;
    },
    clearMessage() {
      this.message = null;
    },
    setLoading(value) {
      this.isLoading = value;
    },
    initialize() {
      this.username = localStorage.getItem("username") || "";
      this.loggedIn = localStorage.getItem("loggedIn") === "true";
      this.access_token = localStorage.getItem("access_token");
      this.refresh_token = localStorage.getItem("refresh_token");
      const expiryTime = localStorage.getItem("token_expiry_time");
      this.token_expiry_time = expiryTime ? parseInt(expiryTime) : null;

      // Re-populate permissions dynamically on initialization
      if (this.user && this.user.role) {
        const roleKey = Object.keys(ROLE_PERMISSIONS).find(
          (k) => k.toLowerCase() === (this.user.role || "").toLowerCase()
        ) || this.user.role;
        this.user.permissions = ROLE_PERMISSIONS[roleKey] || [];
        this.isAdmin = this.user.role.toLowerCase() === 'admin';
      }
    },
  },
});
