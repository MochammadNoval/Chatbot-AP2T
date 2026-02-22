import axios from "axios";
import api from "./Api";

export async function Login(user) {
  try {
    const response = await api.post("/auth/login", user);
    localStorage.setItem("access_token", response.data.access_token);
    return response.data;
  } catch (error) {
    throw error;
  }
}
