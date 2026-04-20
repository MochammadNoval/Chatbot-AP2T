import { defineStore } from "pinia";
import { isTokenExpired, isTokenExpiringSoon } from "../utils/tokenUtils";

export const useAuthStores = defineStore("auth", {
  state: () => ({
    username: "",
    loggedIn: false,
    isAdmin: false,
    message: null,
    isLoading: false,
    sessionExpired: false,
    access_token: null,
    refresh_token: null,
    token_expiry_time: null
  }),
  
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
      this.isAdmin = user.isAdmin || false;
      
      // Simpan tokens
      this.access_token = tokens.access_token || localStorage.getItem("access_token");
      this.refresh_token = tokens.refresh_token || null;
      
      // Set token expiry time (expires_in dalam detik)
      if (tokens.expires_in) {
        this.token_expiry_time = Date.now() + (tokens.expires_in * 1000);
      }
      
      // Simpan ke localStorage
      if (tokens.access_token) {
        localStorage.setItem("access_token", tokens.access_token);
      }
      if (tokens.refresh_token) {
        localStorage.setItem("refresh_token", tokens.refresh_token);
      }
      if (this.token_expiry_time) {
        localStorage.setItem("token_expiry_time", this.token_expiry_time.toString());
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
      
      localStorage.removeItem("username");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("user_id");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_expiry_time");
    },
    handleUnauthorized(){
      if(this.sessionExpired) return;
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
    },
  },
});
