import { defineStore } from "pinia";

export const useAuthStores = defineStore("auth", {
  state: () => ({
    username: "",
    loggedIn: false,
    isAdmin: false,
    message: null,
    isLoading: false,
    sessionExpired: false
  }),
  actions: {
    login(user) {
      this.username = user.name;
      this.loggedIn = true;
      this.isAdmin = user.isAdmin || false;
      localStorage.setItem("username", user.username);
      localStorage.setItem("loggedIn", true);
      localStorage.setItem("user_id", user.id);
    },
    logout() {
      this.username = "";
      this.loggedIn = false;
      this.isAdmin = false;
      localStorage.removeItem("username");
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("user_id");
          localStorage.removeItem("access_token");
    },
    handleUnauthorized(){
      if(this.sessionExpired) return;
      this.sessionExpired = true;
      this.logout()
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
      this.username = localStorage.getItem("username" || "");
      this.loggedIn = localStorage.getItem("loggedIn") === "true";
    },
  },
});
