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

export function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      message: "Password tidak boleh kosong",
    };
  }

  // Cek panjang minimal 8 karakter
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password minimal harus 8 karakter",
    };
  }

  // Cek ada minimal 1 huruf kapital
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password harus mengandung minimal 1 huruf besar (A-Z)",
    };
  }

  // Cek ada minimal 1 simbol
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: "Password harus mengandung minimal 1 simbol (!@#$%^&*...)",
    };
  }

  return {
    isValid: true,
    message: "Password valid",
  };
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
    // Validasi input ada atau tidak
    if (!userData || typeof userData !== "object") {
      throw new Error("Data user harus berupa object");
    }

    // Validasi email
    if (
      !userData.email ||
      typeof userData.email !== "string" ||
      userData.email.trim() === ""
    ) {
      throw new Error("Email tidak boleh kosong");
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error("Format email tidak valid");
    }

    // Validasi name
    if (
      !userData.name ||
      typeof userData.name !== "string" ||
      userData.name.trim() === ""
    ) {
      throw new Error("Nama tidak boleh kosong");
    }

    // Validasi password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    // Normalisasi data
    const normalizedData = {
      email: userData.email.trim().toLowerCase(),
      name: userData.name.trim(),
      password: userData.password,
    };

    // Request ke server
    const response = await api.post("/auth/register", normalizedData);

    if (!response.data) {
      throw new Error("Response dari server tidak valid");
    }

    return response.data;
  } catch (error) {
    // Jika error dari validasi input
    if (error instanceof Error && !error.response) {
      throw error;
    }

    // Error dari API
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
