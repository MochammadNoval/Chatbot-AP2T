import api from "./Api";

/**
 * Service untuk mengelola data user
 */

/**
 * Ambil daftar semua user dari endpoint /auth?users
 * @returns {Promise}
 */
export async function getUsers() {
  try {
    const response = await api.get("/auth/users");
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Ambil daftar semua user
 * @returns {Promise}
 */
export async function getAllUsers(page = 1, limit = 10, search = "") {
  try {
    const response = await api.get("/users", {
      params: {
        page,
        limit,
        search,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Ambil detail user berdasarkan ID
 * @param {number} id
 * @returns {Promise}
 */
export async function getUserById(id) {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create user baru
 * @param {Object} userData - { email, name, password }
 * @returns {Promise}
 */
export async function createUser(userData) {
  try {
    const response = await api.post("/users", {
      email: userData.email,
      name: userData.name,
      password: userData.password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update user
 * @param {number} id
 * @param {Object} userData
 * @returns {Promise}
 */
export async function updateUser(id, userData) {
  try {
    const response = await api.put(`/auth/user/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Hapus user
 * @param {number} id
 * @returns {Promise}
 */
export async function deleteUser(id) {
  try {
    const response = await api.delete(`/auth/user/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
