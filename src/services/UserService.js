import axios from "axios";

export async function fetchUsers() {
  try {
    const response = await axios.get("/api/login");
    return response.data;
  } catch (error) {
    throw error;
  }
}
