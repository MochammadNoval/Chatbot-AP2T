import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("item");
      setTimeout(() => {
        window.location.href = "/login";
      }, 4000);
    }
    return Promise.reject(error);
  },
);

export default api;
